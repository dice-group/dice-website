import { navigate } from 'gatsby';
import { useEffect } from 'react';

const StudentsRedirect = () => {
  // redirect to teaching page
  useEffect(() => {
    navigate('/students/teaching/');
  }, []);

  return null;
};

export default StudentsRedirect;
