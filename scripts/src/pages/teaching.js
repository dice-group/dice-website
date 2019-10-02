import { navigate } from 'gatsby';
import { useEffect } from 'react';

const TeachingRedirect = () => {
  // redirect to teaching page
  useEffect(() => {
    navigate('/students/teaching/');
  }, []);

  return null;
};

export default TeachingRedirect;
