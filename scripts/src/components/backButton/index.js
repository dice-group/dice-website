import React from 'react';

const goBack = e => {
  e.preventDefault();
  window.history.back();
};

export default function BackButton() {
  return (
    <a href="#" onClick={goBack}>
      ← Go back
    </a>
  );
}
