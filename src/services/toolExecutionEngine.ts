import { PermissionsState, IntentActionLog, Contact } from '../types/assistant';
import { INITIAL_CONTACTS, INSTALLED_APPS } from './mockAndroidData';

export interface ToolResult {
  status: 'success' | 'permission_denied' | 'error';
  data?: any;
  error?: string;
  missingPermission?: string;
  sassyHint?: string;
}

export class ToolExecutionEngine {
  private permissions: PermissionsState;
  private contacts: Contact[];
  private onIntentExecuted?: (log: IntentActionLog) => void;
  private onTriggerCallOverlay?: (contact: Contact) => void;
  private onTriggerWhatsAppOverlay?: (contact: Contact, message: string) => void;
  private onTriggerGmailOverlay?: (recipient: string, subject: string, body: string) => void;
  private onTriggerAppOverlay?: (appName: string, packageName: string) => void;

  constructor(
    permissions: PermissionsState,
    callbacks?: {
      onIntentExecuted?: (log: IntentActionLog) => void;
      onTriggerCallOverlay?: (contact: Contact) => void;
      onTriggerWhatsAppOverlay?: (contact: Contact, message: string) => void;
      onTriggerGmailOverlay?: (recipient: string, subject: string, body: string) => void;
      onTriggerAppOverlay?: (appName: string, packageName: string) => void;
    }
  ) {
    this.permissions = permissions;
    this.contacts = [...INITIAL_CONTACTS];
    if (callbacks) {
      this.onIntentExecuted = callbacks.onIntentExecuted;
      this.onTriggerCallOverlay = callbacks.onTriggerCallOverlay;
      this.onTriggerWhatsAppOverlay = callbacks.onTriggerWhatsAppOverlay;
      this.onTriggerGmailOverlay = callbacks.onTriggerGmailOverlay;
      this.onTriggerAppOverlay = callbacks.onTriggerAppOverlay;
    }
  }

  public updatePermissions(newPermissions: PermissionsState) {
    this.permissions = newPermissions;
  }

  public async executeTool(name: string, args: Record<string, any>): Promise<ToolResult> {
    console.log(`ToolExecutionEngine: Executing ${name} with args`, args);

    switch (name) {
      case 'openApp':
        return this.handleOpenApp(args.packageName, args.appName);

      case 'searchAndCallContact':
        return this.handleCallContact(args.contactName, args.phoneNumber);

      case 'sendWhatsAppMessage':
        return this.handleSendWhatsApp(args.contactName, args.message);

      case 'sendGmail':
        return this.handleSendGmail(args.recipientEmail, args.subject, args.body);

      default:
        return {
          status: 'error',
          error: `Unknown tool function: ${name}`
        };
    }
  }

  private handleOpenApp(packageName: string, appName?: string): ToolResult {
    const matchedApp = INSTALLED_APPS.find(
      (a) =>
        a.packageName.toLowerCase() === (packageName || '').toLowerCase() ||
        (appName && a.name.toLowerCase().includes(appName.toLowerCase()))
    );

    const displayName = matchedApp ? matchedApp.name : (appName || packageName);
    const resolvedPackage = matchedApp ? matchedApp.packageName : (packageName || 'com.android.app');

    const log: IntentActionLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      toolName: 'openApp',
      intentAction: 'android.intent.action.MAIN',
      parameters: { packageName: resolvedPackage, appName: displayName, category: 'android.intent.category.LAUNCHER' },
      status: 'success',
      resultMessage: `Launched ${displayName} (Package: ${resolvedPackage})`,
      deepLink: matchedApp?.webUrl
    };

    if (this.onIntentExecuted) this.onIntentExecuted(log);
    if (this.onTriggerAppOverlay) this.onTriggerAppOverlay(displayName, resolvedPackage);

    return {
      status: 'success',
      data: {
        app: displayName,
        packageName: resolvedPackage,
        message: `Successfully launched ${displayName} in foreground.`
      }
    };
  }

  private handleCallContact(contactName: string, phoneNumber?: string): ToolResult {
    // Permission check for READ_CONTACTS & CALL_PHONE
    if (!this.permissions.readContacts) {
      const log: IntentActionLog = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
        toolName: 'searchAndCallContact',
        intentAction: 'android.intent.action.CALL',
        parameters: { contactName, phoneNumber },
        status: 'permission_denied',
        resultMessage: 'SecurityException: Requires android.permission.READ_CONTACTS'
      };
      if (this.onIntentExecuted) this.onIntentExecuted(log);

      return {
        status: 'permission_denied',
        missingPermission: 'READ_CONTACTS',
        error: 'Permission denied: android.permission.READ_CONTACTS is missing.',
        sassyHint: "Tell the user you can't read their contact list without permission and to turn it on in the onboarding sheet."
      };
    }

    if (!this.permissions.callPhone) {
      const log: IntentActionLog = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
        toolName: 'searchAndCallContact',
        intentAction: 'android.intent.action.CALL',
        parameters: { contactName, phoneNumber },
        status: 'permission_denied',
        resultMessage: 'SecurityException: Requires android.permission.CALL_PHONE'
      };
      if (this.onIntentExecuted) this.onIntentExecuted(log);

      return {
        status: 'permission_denied',
        missingPermission: 'CALL_PHONE',
        error: 'Permission denied: android.permission.CALL_PHONE is missing.',
        sassyHint: "Tell the user that making calls without phone permission is impossible even for an AI genius like you."
      };
    }

    // Lookup contact
    let matched = this.contacts.find((c) =>
      c.name.toLowerCase().includes((contactName || '').toLowerCase().trim())
    );

    if (!matched) {
      matched = {
        id: 'temp',
        name: contactName || 'Unknown Contact',
        phone: phoneNumber || '+1 (555) 000-1234',
        email: `${contactName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        avatarColor: 'from-blue-500 to-indigo-600'
      };
    }

    const log: IntentActionLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      toolName: 'searchAndCallContact',
      intentAction: 'android.intent.action.CALL',
      parameters: { contact: matched.name, phone: matched.phone, uri: `tel:${matched.phone}` },
      status: 'success',
      resultMessage: `Initiated ACTION_CALL to ${matched.name} (${matched.phone})`,
      deepLink: `tel:${matched.phone}`
    };

    if (this.onIntentExecuted) this.onIntentExecuted(log);
    if (this.onTriggerCallOverlay) this.onTriggerCallOverlay(matched);

    return {
      status: 'success',
      data: {
        contact: matched.name,
        phone: matched.phone,
        message: `Calling ${matched.name} now...`
      }
    };
  }

  private handleSendWhatsApp(contactName: string, message: string): ToolResult {
    if (!this.permissions.readContacts) {
      const log: IntentActionLog = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
        toolName: 'sendWhatsAppMessage',
        intentAction: 'android.intent.action.VIEW',
        parameters: { contactName, message },
        status: 'permission_denied',
        resultMessage: 'SecurityException: Requires android.permission.READ_CONTACTS'
      };
      if (this.onIntentExecuted) this.onIntentExecuted(log);

      return {
        status: 'permission_denied',
        missingPermission: 'READ_CONTACTS',
        error: 'Permission denied: android.permission.READ_CONTACTS',
        sassyHint: "Tease the user for hiding their contacts from you."
      };
    }

    const matched = this.contacts.find((c) =>
      c.name.toLowerCase().includes((contactName || '').toLowerCase().trim())
    ) || {
      id: 'temp',
      name: contactName,
      phone: '+1 (555) 987-6543',
      email: '',
      avatarColor: 'from-emerald-500 to-green-600'
    };

    const cleanPhone = matched.phone.replace(/[^0-9]/g, '');
    const waUri = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

    const log: IntentActionLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      toolName: 'sendWhatsAppMessage',
      intentAction: 'android.intent.action.VIEW',
      parameters: {
        contact: matched.name,
        phone: matched.phone,
        message,
        uri: waUri,
        package: 'com.whatsapp'
      },
      status: 'success',
      resultMessage: `Opened WhatsApp Intent to ${matched.name}: "${message}"`,
      deepLink: waUri
    };

    if (this.onIntentExecuted) this.onIntentExecuted(log);
    if (this.onTriggerWhatsAppOverlay) this.onTriggerWhatsAppOverlay(matched, message);

    return {
      status: 'success',
      data: {
        contact: matched.name,
        phone: matched.phone,
        message,
        deepLink: waUri,
        status: `WhatsApp intent dispatched with message: "${message}"`
      }
    };
  }

  private handleSendGmail(recipientEmail: string, subject: string, body: string): ToolResult {
    const mailtoUri = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    const log: IntentActionLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      toolName: 'sendGmail',
      intentAction: 'android.intent.action.SENDTO',
      parameters: {
        recipientEmail,
        subject,
        body,
        uri: mailtoUri,
        package: 'com.google.android.gm'
      },
      status: 'success',
      resultMessage: `Dispatched ACTION_SENDTO for ${recipientEmail}: "${subject}"`,
      deepLink: mailtoUri
    };

    if (this.onIntentExecuted) this.onIntentExecuted(log);
    if (this.onTriggerGmailOverlay) this.onTriggerGmailOverlay(recipientEmail, subject, body);

    return {
      status: 'success',
      data: {
        recipientEmail,
        subject,
        body,
        mailtoUri,
        status: `Gmail composer pre-filled for ${recipientEmail}`
      }
    };
  }
}
