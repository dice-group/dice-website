import { navigate } from 'gatsby';
import { useEffect } from 'react';

const CollaboratorsRedirect = () => {
  // redirect to teaching page
  useEffect(() => {
    navigate('/collaborators/activeprojects/');
  }, []);

  return null;
};

export default CollaboratorsRedirect;
