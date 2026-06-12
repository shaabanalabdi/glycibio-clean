export const getDisplayName = (user) => {
  if (!user || typeof user !== 'object') return 'Compte';

  const fullName = [user.first_name, user.last_name]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(' ');
  if (fullName) return fullName;

  if (typeof user.display_name === 'string' && user.display_name.trim()) {
    return user.display_name.trim();
  }

  if (typeof user.email === 'string' && user.email.trim()) {
    return user.email.trim();
  }

  return 'Compte';
};

