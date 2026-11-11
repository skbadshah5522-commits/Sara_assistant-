import { Contact, AndroidApp } from '../types/assistant';

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'c1',
    name: 'Alex Rivera',
    phone: '+1 (555) 234-8901',
    email: 'alex.rivera@example.com',
    avatarColor: 'from-pink-500 to-rose-600',
    relation: 'Best Friend'
  },
  {
    id: 'c2',
    name: 'Sarah Chen',
    phone: '+1 (555) 789-1234',
    email: 'sarah.chen@techstartup.io',
    avatarColor: 'from-purple-500 to-indigo-600',
    relation: 'Colleague'
  },
  {
    id: 'c3',
    name: 'Mom',
    phone: '+1 (555) 901-4567',
    email: 'mom.sweetheart@gmail.com',
    avatarColor: 'from-amber-400 to-orange-500',
    relation: 'Family'
  },
  {
    id: 'c4',
    name: 'David Miller',
    phone: '+1 (555) 345-6789',
    email: 'dmiller.corp@enterprises.com',
    avatarColor: 'from-emerald-400 to-teal-600',
    relation: 'Work'
  },
  {
    id: 'c5',
    name: 'Emma Watson',
    phone: '+1 (555) 678-9012',
    email: 'emma.w@creative.studio',
    avatarColor: 'from-cyan-400 to-blue-600',
    relation: 'Friend'
  }
];

export const INSTALLED_APPS: AndroidApp[] = [
  {
    name: 'YouTube',
    packageName: 'com.google.android.youtube',
    icon: 'PlaySquare',
    category: 'media',
    webUrl: 'https://youtube.com'
  },
  {
    name: 'Instagram',
    packageName: 'com.instagram.android',
    icon: 'Camera',
    category: 'social',
    webUrl: 'https://instagram.com'
  },
  {
    name: 'WhatsApp',
    packageName: 'com.whatsapp',
    icon: 'MessageCircle',
    category: 'communication',
    webUrl: 'https://web.whatsapp.com'
  },
  {
    name: 'Spotify',
    packageName: 'com.spotify.music',
    icon: 'Music',
    category: 'media',
    webUrl: 'https://open.spotify.com'
  },
  {
    name: 'Calculator',
    packageName: 'com.google.android.calculator',
    icon: 'Calculator',
    category: 'utility'
  },
  {
    name: 'Gmail',
    packageName: 'com.google.android.gm',
    icon: 'Mail',
    category: 'communication',
    webUrl: 'https://mail.google.com'
  },
  {
    name: 'Google Maps',
    packageName: 'com.google.android.apps.maps',
    icon: 'MapPin',
    category: 'utility',
    webUrl: 'https://maps.google.com'
  },
  {
    name: 'Android Settings',
    packageName: 'com.android.settings',
    icon: 'Settings',
    category: 'utility'
  }
];
