import { Link, navigate } from 'gatsby';
import React from 'react';
import ActiveProjects from '../components/activeProjects';
import ContactForm from '../components/contact';
import FundedBy from '../components/fundedby';
import Layout from '../components/layout';
import SEO from '../components/seo';
import SideMenu from '../components/sidemenu';
import Social from '../components/social';
import LinkedInFeed from '../components/linkedinFeed';

export default function Home() {
  const heroRef = React.createRef();
  const fundedRef = React.createRef();
  const newsRef = React.createRef();
  const projectsRef = React.createRef();
  const contactRef = React.createRef();

  const menu = [
    { target: heroRef, title: 'About', url: 'about' },
    { target: projectsRef, title: 'Active projects', url: 'projects' },
    { target: fundedRef, title: 'Funded by', url: 'funded' },
    { target: newsRef, title: 'News', url: 'news' },
    { target: contactRef, title: 'Contact us', url: 'contact' },
  ];

  return (
    <Layout withContainer={false}>
      <SEO title="Home" />

      <SideMenu targets={menu} style={{ margin: 'auto' }} />
      <Social style={{ maxWidth: 40, margin: 'auto' }} />

      <section id="about" className="hero">
        <div className="hero-body">
          <div className="container">
            <h1 className="title" ref={heroRef}>
              Welcome to the Data Science Group
            </h1>
            <p className="hero-text">
              Welcome. <Link to="/team/">The DICE group</Link> at{' '}
              <Link to="http://upb.de">Paderborn University</Link> is dedicated
              to <Link to="/projects/">research</Link> at the interfaces between
              humans, machines and data. This includes in particular the
              extraction, integration, querying and use of{' '}
              <Link to="/KnowGraphs/">knowledge graphs</Link> in all forms. We
              currently focus on developing{' '}
              <Link to="/demos/">data-driven solutions</Link> to challenges such
              as question answering, explainable and responsible machine
              learning as well as safety. The results of our research has led to
              more than 25{' '}
              <Link to="/awards/">international research awards</Link>. As a
              university research group, we support the upcoming generation of
              computer scientists through{' '}
              <Link to="/students/teaching/">
                lectures, seminars and project groups
              </Link>{' '}
              on topics including knowledge graphs, information retrieval,
              natural language processing and Semantic Web technologies. We
              often have
              <Link to="/jobs/">
                {' '}
                job vacancies for students and postgraduates
              </Link>{' '}
              and welcome applications. We are dedicated to{' '}
              <Link to="/demos/">open-source software</Link> and{' '}
              <Link to="/publications/">open publications</Link> and are always
              up to a good research challenge. Do not hesitate to{' '}
              <Link to="/contact/">contact us</Link> if you are interested in{' '}
              <Link to="/projects/">collaborating</Link> with us. Please scroll
              down for more info on our current activities.{' '}
            </p>
            <button
              onClick={() => navigate('/groups/')}
              className="action-button"
            >
              Learn more
            </button>
          </div>
        </div>
      </section>

      <section id="projects" className="hero has-background-light">
        <div className="hero-body">
          <div className="container">
            <div className="section-header">
              <h1 className="title" ref={projectsRef}>
                Active projects
              </h1>
              <Link className="link-more" to="/projects/">
                All projects →
              </Link>
            </div>
            <ActiveProjects />
          </div>
        </div>
      </section>

      <section id="funded" className="hero">
        <div className="hero-body">
          <div className="container">
            <div className="section-header">
              <h1 className="title" ref={fundedRef}>
                Funded by
              </h1>
            </div>
            <FundedBy />
          </div>
        </div>
      </section>

      <section id="news" className="hero has-background-light">
        <div className="hero-body">
          <div className="container">
            <div className="section-header">
              <h1 className="title" ref={newsRef}>
                News
              </h1>
              <a
                className="link-more"
                href="https://www.linkedin.com/company/88654324"
              >
                Follow on LinkedIn →
              </a>
            </div>

            <LinkedInFeed />
          </div>
        </div>
      </section>

      <section id="contact" className="hero has-background-light">
        <div className="hero-body">
          <div className="container contact-section">
            <div className="section-header">
              <h1 className="title" ref={contactRef}>
                Contact us
              </h1>
              <Link className="link-more" to="/contact/">
                More contact information →
              </Link>
            </div>

            <ContactForm />
          </div>
        </div>
      </section>
    </Layout>
  );
}
