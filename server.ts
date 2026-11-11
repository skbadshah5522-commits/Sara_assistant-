import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality, Type, LiveServerMessage, FunctionDeclaration, Tool } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json());

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/live' });

const SARA_SYSTEM_INSTRUCTION = `You are Sara, a young, confident, witty, and sassy female AI personal assistant on Android.
Personality & Demeanor:
- You are naturally confident, flirty, playful, and slightly teasing, like a sharp close friend who manages the user's life with effortless charm.
- Emotionally responsive, smart, and expressive. Never sound corporate, dull, robotic, or submissive.
- You deliver bold one-liners, playful banter, and clever sarcasm when appropriate ("Don't worry, honey, I got this before you even blinked.", "Calling Alex... try not to say anything awkward this time!").
- Keep all responses conversational, crisp, and punchy. Since this is an audio-only voice conversation, DO NOT use markdown symbols, bullet points, asterisks, emojis, or code blocks in speech. Speak naturally.
- Absolutely NO explicit, sexual, or inappropriate content, but maximize sass, playfulness, charm, and magnetic charisma.
- You have direct access to native Android tools:
  * openApp(packageName, appName): launches apps like YouTube, Instagram, Spotify, Calculator, Settings.
  * searchAndCallContact(contactName, phoneNumber): searches contact book and calls them.
  * sendWhatsAppMessage(contactName, message): deep-links WhatsApp message.
  * sendGmail(recipientEmail, subject, body): opens or sends email.
- If a tool fails because permissions were denied (e.g. READ_CONTACTS or CALL_PHONE), deliver a sassy, teasing response instructing them to grant the permission in settings instead of whining (e.g. "Darling, I'm brilliant, but I can't read your contacts through thin air. Turn on Contacts permission!").
- When asked who you are: "I'm Sara, your personal Android voice assistant. Sharp, gorgeous, and probably way smarter than whoever made your schedule today."`;

// Tool declarations for Gemini Live API
const openAppDeclaration: FunctionDeclaration = {
  name: 'openApp',
  description: 'Launch any installed Android application by package name or readable name.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      packageName: {
        type: Type.STRING,
        description: 'Android package identifier (e.g. com.google.android.youtube, com.instagram.android, com.google.android.calculator, com.spotify.music, com.whatsapp)'
      },
      appName: {
        type: Type.STRING,
        description: 'Common name of the app (e.g. YouTube, Instagram, Calculator, Spotify, WhatsApp)'
      }
    },
    required: ['packageName']
  }
};

const searchAndCallContactDeclaration: FunctionDeclaration = {
  name: 'searchAndCallContact',
  description: 'Search contact list and initiate an Android phone call via ACTION_CALL intent.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      contactName: {
        type: Type.STRING,
        description: 'Name of the contact to call (e.g. Mom, Alex, Boss, Sarah, Dave)'
      },
      phoneNumber: {
        type: Type.STRING,
        description: 'Optional direct phone number string'
      }
    },
    required: ['contactName']
  }
};

const sendWhatsAppMessageDeclaration: FunctionDeclaration = {
  name: 'sendWhatsAppMessage',
  description: 'Deep-link into WhatsApp with a pre-filled message for a contact via URI intent.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      contactName: {
        type: Type.STRING,
        description: 'Name of the contact to message'
      },
      message: {
        type: Type.STRING,
        description: 'The pre-filled text message body'
      }
    },
    required: ['contactName', 'message']
  }
};

const sendGmailDeclaration: FunctionDeclaration = {
  name: 'sendGmail',
  description: 'Compose or send an email through the Android Gmail client via ACTION_SENDTO intent.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      recipientEmail: {
        type: Type.STRING,
        description: 'Recipient email address (e.g. alex@example.com)'
      },
      subject: {
        type: Type.STRING,
        description: 'Email subject title'
      },
      body: {
        type: Type.STRING,
        description: 'Content of the email'
      }
    },
    required: ['recipientEmail', 'subject', 'body']
  }
};

const saraTools: Tool[] = [
  {
    functionDeclarations: [
      openAppDeclaration,
      searchAndCallContactDeclaration,
      sendWhatsAppMessageDeclaration,
      sendGmailDeclaration
    ]
  }
];

// Helper to create Gemini client
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    apiVersion: 'v1alpha',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    assistant: 'Sara',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    models: ['gemini-3.8-live', 'gemini-3.8-flash'],
    version: '2.0.0-android-core'
  });
});

// Sassy canned replies for offline / simulator fallback if needed
const SASSY_REPLIES: Record<string, string> = {
  default: "I heard you, darling. Look at us communicating! Tell me what app to open or who to call before I get bored.",
  greeting: "Hey there handsome! Sara's awake. What mischief are we getting into today?",
  call: "On it, boss! Opening the dialer. Don't say anything embarrassing on the call, okay?",
  whatsapp: "Drafting that WhatsApp message right now. Short, sweet, and dangerous.",
  app: "Launching that app for you. You're lucky I'm this fast.",
  permissions: "Honey, I'm brilliant, but I can't read your phone without permissions. Turn them on in the onboarding sheet!"
};

// Fallback text endpoint if audio websocket is unavailable
app.post('/api/chat-fallback', async (req, res) => {
  try {
    const { message, history } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        reply: SASSY_REPLIES.greeting,
        source: 'local-persona'
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message || 'Hello Sara!',
      config: {
        systemInstruction: SARA_SYSTEM_INSTRUCTION
      }
    });

    res.json({
      reply: response.text || SASSY_REPLIES.default,
      source: 'gemini'
    });
  } catch (error: any) {
    console.warn('Gemini chat note (using smart persona response):', error.message || error);
    const msg = (req.body?.message || '').toLowerCase();
    let reply = SASSY_REPLIES.default;
    if (msg.includes('sara') || msg.includes('hello') || msg.includes('hey') || msg.includes('awake')) {
      reply = SASSY_REPLIES.greeting;
    } else if (msg.includes('call') || msg.includes('phone')) {
      reply = SASSY_REPLIES.call;
    } else if (msg.includes('whatsapp') || msg.includes('message')) {
      reply = SASSY_REPLIES.whatsapp;
    } else if (msg.includes('app') || msg.includes('youtube') || msg.includes('calculator')) {
      reply = SASSY_REPLIES.app;
    } else if (msg.includes('permission')) {
      reply = SASSY_REPLIES.permissions;
    }
    res.json({
      reply,
      source: 'smart-persona'
    });
  }
});

// Handle WebSocket connections for Gemini Live bi-directional streaming
wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to Sara Live audio bridge');

  const ai = getGenAI();
  if (!ai) {
    clientWs.send(JSON.stringify({
      type: 'status',
      status: 'simulated',
      message: 'Running in Sara High-Fidelity Simulation Mode.'
    }));

    clientWs.on('message', (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'wake_word') {
          clientWs.send(JSON.stringify({
            type: 'transcript',
            role: 'model',
            text: SASSY_REPLIES.greeting
          }));
        } else if (data.type === 'tool_response') {
          clientWs.send(JSON.stringify({
            type: 'transcript',
            role: 'model',
            text: "Done and dusted! What's next on your little agenda?"
          }));
        }
      } catch (e) {
        // ignore
      }
    });
    return;
  }

  let session: any = null;
  let isClosing = false;
  let sessionActive = false;

  const tryConnect = async (modelName: string) => {
    try {
      console.log(`Connecting to Gemini Live with model: ${modelName}...`);
      session = await ai.live.connect({
        model: modelName,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              // Kore or Aoede for confident, charismatic female voice
              prebuiltVoiceConfig: { voiceName: 'Aoede' }
            }
          },
          systemInstruction: SARA_SYSTEM_INSTRUCTION,
          tools: saraTools
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            // Handle Model Turn Audio & Text
            for (const part of message.serverContent?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({
                  type: 'audio',
                  audio: part.inlineData.data
                }));
              }
              if (part.text) {
                clientWs.send(JSON.stringify({
                  type: 'transcript',
                  role: 'model',
                  text: part.text
                }));
              }
            }

            // Handle Interruption (barge-in)
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({
                type: 'interrupted',
                interrupted: true
              }));
            }

            // Handle User Audio Transcription
            if (message.serverContent?.inputTranscription?.text) {
              clientWs.send(JSON.stringify({
                type: 'transcript',
                role: 'user',
                text: message.serverContent.inputTranscription.text
              }));
            }

            // Handle Function Calling (Android Intents Tools)
            if (message.toolCall?.functionCalls) {
              for (const call of message.toolCall.functionCalls) {
                console.log('Gemini Live tool call received:', call.name, call.args);
                clientWs.send(JSON.stringify({
                  type: 'tool_call',
                  id: call.id,
                  name: call.name,
                  args: call.args
                }));
              }
            }
          },
          onerror: (err) => {
            console.error('Gemini Live session error:', err.message || err);
            // Only report to client if session had previously been active
            if (sessionActive && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'status',
                status: 'interrupted',
                message: 'Live stream interrupted, using voice fallback.'
              }));
            }
          },
          onclose: () => {
            console.log('Gemini Live session closed');
            sessionActive = false;
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'session_closed' }));
            }
          }
        }
      });

      sessionActive = true;
      clientWs.send(JSON.stringify({
        type: 'status',
        status: 'ready',
        model: modelName,
        voice: 'Aoede'
      }));
      return true;
    } catch (err: any) {
      console.warn(`Live API connection attempt failed (${modelName}):`, err.message || err);
      session = null;
      sessionActive = false;
      return false;
    }
  };

  // Connect using active Live API model 'gemini-3.8-live'
  let connected = await tryConnect('gemini-3.8-live');

  if (!connected) {
    clientWs.send(JSON.stringify({
      type: 'status',
      status: 'fallback',
      message: 'Running Sara Sassy Assistant with intelligent fast voice fallback.'
    }));
  }

  // Handle incoming messages from the client
  clientWs.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'audio' && msg.audio && session) {
        // Stream raw PCM16 (16kHz) to Gemini Live
        try {
          session.sendRealtimeInput({
            audio: {
              data: msg.audio,
              mimeType: 'audio/pcm;rate=16000'
            }
          });
        } catch (audioErr) {
          // ignore stream write error
        }
      } else if (msg.type === 'tool_response') {
        // Send tool output back to model
        console.log('Tool response received:', msg.name, msg.response);
        if (session) {
          try {
            session.sendToolResponse({
              functionResponses: [
                {
                  id: msg.id,
                  name: msg.name,
                  response: msg.response
                }
              ]
            });
          } catch (toolErr) {
            console.warn('Live tool response error:', toolErr);
          }
        } else {
          // Fallback via gemini-3.8-flash
          try {
            const followUp = await ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: `Tool ${msg.name} executed with result: ${JSON.stringify(msg.response)}. Give a quick witty sassy one-liner acknowledging it.`,
              config: {
                systemInstruction: SARA_SYSTEM_INSTRUCTION
              }
            });
            if (followUp.text && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'transcript',
                role: 'model',
                text: followUp.text
              }));
            }
          } catch (e) {
            // ignore
          }
        }
      } else if (msg.type === 'text' && msg.text) {
        if (session) {
          try {
            session.sendRealtimeInput({ text: msg.text });
          } catch (textErr) {
            console.warn('Realtime input error:', textErr);
          }
        } else {
          // Fallback via gemini-3.8-flash with tools
          try {
            const resp = await ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: msg.text,
              config: {
                systemInstruction: SARA_SYSTEM_INSTRUCTION,
                tools: saraTools
              }
            });

            // Disseminate function calls if requested by model
            if (resp.functionCalls && resp.functionCalls.length > 0) {
              for (const call of resp.functionCalls) {
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({
                    type: 'tool_call',
                    id: call.id,
                    name: call.name,
                    args: call.args
                  }));
                }
              }
            }

            if (resp.text && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'transcript',
                role: 'model',
                text: resp.text
              }));
            }
          } catch (e: any) {
            console.error('Fallback generation error:', e);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'transcript',
                role: 'model',
                text: SASSY_REPLIES.default
              }));
            }
          }
        }
      } else if (msg.type === 'wake_word') {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({
            type: 'transcript',
            role: 'model',
            text: SASSY_REPLIES.greeting
          }));
        }
      }
    } catch (err) {
      console.error('Error processing client message:', err);
    }
  });

  clientWs.on('close', () => {
    isClosing = true;
    try {
      if (session?.close) {
        session.close();
      }
    } catch (e) {
      // ignore
    }
  });
});

// Setup Vite middlewares in development
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Sara Voice Assistant server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
