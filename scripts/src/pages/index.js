import { Link, navigate } from 'gatsby';
import React from 'react';
import { TwitterTimelineEmbed } from 'react-twitter-embed';
import ActiveProjects from '../components/activeProjects';
import ContactForm from '../components/contact';
import FundedBy from '../components/fundedby';
import Layout from '../components/layout';
import News from '../components/news';
import SEO from '../components/seo';
import SideMenu from '../components/sidemenu';
import Social from '../components/social';

export default function Home() {
  const heroRef = React.createRef();
  const fundedRef = React.createRef();
  const newsRef = React.createRef();
  const projectsRef = React.createRef();
  const tweetsRef = React.createRef();
  const contactRef = React.createRef();

  const menu = [
    { target: heroRef, title: 'About', url: 'about' },
    { target: projectsRef, title: 'Active projects', url: 'projects' },
    { target: fundedRef, title: 'Funded by', url: 'funded' },
    { target: tweetsRef, title: 'Latest tweets', url: 'tweets' },
    { target: newsRef, title: 'News', url: 'news' },
    { target: contactRef, title: 'Contact us', url: 'contact' },
  ];

  return (
    <Layout withContainer={false}>
      <SEO title="Home" />

      <SideMenu targets={menu} style={{ margin: 'auto' }} />
      <Social style={{ maxWidth: 40, margin: 'auto' }} />

      <section id="about" className="hero hero-row is-medium">
        <div className="hero-body">
          <div className="container content">
            <h1 className="title" ref={heroRef}>
              Welcome to the Data Science Group
            </h1>
            <p className="hero-text">
              We are DICE (Data Science Group).{' '}
              <Link to="/team/">Our team</Link> develops methods,algorithms and
              applications for the extraction, integrations, storage, querying,
              access and consumption of large-scale datasets. DICE focuses on
              knowledge-driven methods. We are dedicated to{' '}
              <Link to="/collaborators/demos/">open-source</Link> software and{' '}
              <Link to="/publications/">open publications</Link>.
            </p>
            <button
              onClick={() => navigate('/projects/')}
              className="button is-link action-button"
            >
              Learn more
            </button>
          </div>
        </div>
      </section>

      <section id="projects" className="hero has-background-light is-medium">
        <div className="hero-body">
          <div className="container content">
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

      <section id="funded" className="hero has-background-white is-medium">
        <div className="hero-body">
          <div className="container content">
            <div className="section-header">
              <h1 className="title" ref={fundedRef}>
                Funded by
              </h1>
            </div>
            <FundedBy />
          </div>
        </div>
      </section>

      <section id="tweets" className="hero has-background-light is-medium">
        <div className="hero-body">
          <div className="container content">
            <div className="section-header">
              <h1 className="title" ref={tweetsRef}>
                Latest tweets
              </h1>
              <a className="link-more" href="https://twitter.com/DiceResearch">
                Follow →
              </a>
            </div>

            <TwitterTimelineEmbed
              sourceType="profile"
              screenName="DiceResearch"
              noFooter
              noHeader
              noScrollbar
              autoHeight
              options={{ tweetLimit: 3, dnt: true }}
            />
          </div>
        </div>
      </section>

      <section id="news" className="hero has-background-white is-medium">
        <div className="hero-body">
          <div className="container content">
            <div className="section-header">
              <h1 className="title" ref={newsRef}>
                News
              </h1>
              <Link className="link-more" to="/news/">
                More news →
              </Link>
            </div>

            <News paginate={false} />
          </div>
        </div>
      </section>

      <section id="contact" className="hero has-background-light is-medium">
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
