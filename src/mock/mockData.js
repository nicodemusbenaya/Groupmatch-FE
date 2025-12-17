// Mock data untuk simulasi backend

export const ROLES = [
  { value: 'BE Engineer', label: 'BE Engineer', color: 'bg-blue-500' },
  { value: 'FE Engineer', label: 'FE Engineer', color: 'bg-green-500' },
  { value: 'Quality Assurance', label: 'QA Engineer', color: 'bg-yellow-500' },
  { value: 'Project Manager', label: 'Project Manager', color: 'bg-purple-500' }
];

export const DUMMY_USERS = [
  {
    id: 'bot-1',
    username: 'sarah_dev',
    name: 'Sarah Anderson',
    role: 'BE Engineer',
    skills: ['Node.js', 'MongoDB', 'Python'],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
  },
  {
    id: 'bot-2',
    username: 'mike_ui',
    name: 'Mike Thompson',
    role: 'FE Engineer',
    skills: ['React', 'TypeScript', 'Tailwind'],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike'
  },
  {
    id: 'bot-3',
    username: 'jane_qa',
    name: 'Jane Wilson',
    role: 'Quality Assurance',
    skills: ['Jest', 'Selenium', 'Postman'],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane'
  },
  {
    id: 'bot-4',
    username: 'alex_pm',
    name: 'Alex Martinez',
    role: 'Project Manager',
    skills: ['Agile', 'Jira', 'Scrum'],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
  },
  {
    id: 'bot-5',
    username: 'emma_backend',
    name: 'Emma Roberts',
    role: 'BE Engineer',
    skills: ['Java', 'Spring', 'PostgreSQL'],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma'
  },
  {
    id: 'bot-6',
    username: 'chris_frontend',
    name: 'Chris Lee',
    role: 'FE Engineer',
    skills: ['Vue', 'CSS', 'Figma'],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chris'
  }
];

export const MOCK_CHAT_RESPONSES = [
  'Sounds good! Let\'s start planning.',
  'I agree with that approach.',
  'What about the timeline?',
  'Great idea! I can help with that.',
  'We should discuss this further.',
  'I\'ll work on my part ASAP.',
  'Anyone has experience with this?',
  'Let\'s schedule a meeting.'
];

export const getRandomBotResponse = () => {
  return MOCK_CHAT_RESPONSES[Math.floor(Math.random() * MOCK_CHAT_RESPONSES.length)];
};

export const getDummyUsersForMatchmaking = (currentUserRole) => {
  // Get 3 users with different roles
  const availableRoles = ROLES.map(r => r.value).filter(r => r !== currentUserRole);
  const selectedUsers = [];
  
  availableRoles.forEach(role => {
    const usersWithRole = DUMMY_USERS.filter(u => u.role === role);
    if (usersWithRole.length > 0) {
      selectedUsers.push(usersWithRole[Math.floor(Math.random() * usersWithRole.length)]);
    }
  });
  
  return selectedUsers.slice(0, 3);
};
