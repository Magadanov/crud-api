import { User } from '../types/users.types';

export const validateUser = (user: Omit<User, 'id'>) => {
  const { username, age, hobbies } = user;
  const errorMessages = [];

  if (!username || !age || !hobbies) {
    let missedFields = [];
    if (!username) missedFields.push('username');
    if (!age) missedFields.push('age');
    if (!hobbies) missedFields.push('hobbies');
    errorMessages.push(`Missing required fields: ${missedFields.join(', ')}`);
  }

  if (username) {
    if (typeof username !== 'string') {
      errorMessages.push('Invalid username');
    } else if (username.length < 3 || username.length > 20) {
      errorMessages.push('Username must be between 3 and 20 characters');
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errorMessages.push(
        'Username can only contain letters, numbers, and underscores',
      );
    }
  }

  if (age) {
    if (typeof age !== 'number') {
      errorMessages.push('Invalid age');
    } else if (age < 0) {
      errorMessages.push('Age cannot be negative');
    }
  }

  if (hobbies) {
    if (!Array.isArray(hobbies)) {
      errorMessages.push('Invalid hobbies');
    } else if (!hobbies.every((hobby) => typeof hobby === 'string')) {
      errorMessages.push('Hobbies must be an array of strings');
    } else if (hobbies.length === 0) {
      errorMessages.push('Hobbies cannot be empty');
    }
  }

  return {
    isValid: errorMessages.length === 0,
    errors: errorMessages,
  };
};
