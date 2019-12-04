import React from 'react';

const phoneRegex = /\+49(\d{4})(\d+)/;

const cleanPhone = phone => phone.replace('tel:', '').replace(/[\s-]/g, '');

const formatPhone = phone => {
  // cleanup string from data, remove tel: prefix, extra dashes/spaces
  const cleanNumber = cleanPhone(phone);
  // check if we actually have a number
  if (!cleanNumber.length) {
    return '';
  }
  // match to +49-4digits-rest
  const res = phoneRegex.exec(cleanNumber);
  // construct DIN 5008 international number
  return `+49 ${res[1]} ${res[2]}`;
};

export default ({ phone }) => (
  <a href={`tel:${cleanPhone(phone)}`}>{formatPhone(phone)}</a>
);
