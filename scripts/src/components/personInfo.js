import React from 'react';
import Image from './image';
import PersonIdentityLinks from './personIdentityLinks';
import Phone from './phone';
import './styles/person-info.css';

// Accepts the person data object used by the RDF profile query.
export default function PersonInfo({ data }) {
  const {
    name,
    namePrefix,
    role,
    phone,
    fax,
    email,
    chat,
    office,
    photo,
    sameAs,
  } = data;

  return (
    <div className="person-info">
      <div className="person-image">
        <Image
          filename={photo}
          alt={`${[namePrefix, name].filter(Boolean).join(' ')} photo`}
          style={{ width: 300 }}
        />
      </div>

      <div className="person-data">
        <div className="person-heading">
          <h2>
            {namePrefix} {name}
          </h2>
          <PersonIdentityLinks links={sameAs} name={name} />
        </div>
        {role && <p className="role">{role.data.name}</p>}
        {email && (
          <div className="meta">
            <div className="meta-label">Email</div>
            <div className="meta-value">
              <a href={email}>{email.replace('mailto:', '')}</a>
            </div>
          </div>
        )}
        {chat && (
          <div className="meta">
            <div className="meta-label">Matrix (Chat)</div>
            <div className="meta-value">
              <a href={`https://riot.im/app/#/user/${chat}`}>{chat}</a>
            </div>
          </div>
        )}
        {phone && phone.replace('tel:', '') && (
          <div className="meta">
            <div className="meta-label">Phone</div>
            <div className="meta-value">
              <Phone phone={phone} />
            </div>
          </div>
        )}
        {fax && fax.replace('tel:', '') && (
          <div className="meta">
            <div className="meta-label">Fax</div>
            <div className="meta-value">
              <Phone phone={fax} />
            </div>
          </div>
        )}
        {office && (
          <div className="meta">
            <div className="meta-label">Office</div>
            <div className="meta-value">{office}</div>
          </div>
        )}
      </div>
    </div>
  );
}
