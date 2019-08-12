import { Link } from 'gatsby';
import React from 'react';
import ActiveProjects from '../components/activeProjects';
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

  const menu = [
    { target: heroRef, title: 'About', url: 'about' },
    { target: projectsRef, title: 'Active projects', url: 'projects' },
    { target: fundedRef, title: 'Funded by', url: 'funded' },
    { target: newsRef, title: 'News', url: 'news' },
  ];

  return (
    <Layout withContainer={false}>
      <SEO title="Home" />

      <SideMenu targets={menu} />

      <section id="about" className="hero hero-row is-medium" ref={heroRef}>
        <Social />

        <div className="hero-body">
          <div className="container content">
            <h1 className="title">Welcome to the Data Science Group</h1>
            <p className="hero-text">
              We are DICE (Data Science Group).{' '}
              <Link to="/team/">Our team</Link> develops methods,algorithms and
              applications for the extraction, integrations, storage, querying,
              access and consumption of large-scale datasets. DICE focuses on
              knowledge-driven methods. We are dedicated to{' '}
              <Link to="/demos/">open-source</Link> software and{' '}
              <Link to="/publications/">open publications</Link>.
            </p>
            <button className="button is-link action-button">Learn more</button>
          </div>
        </div>
      </section>

      <section
        id="projects"
        className="hero has-background-light is-medium"
        ref={projectsRef}
      >
        <div className="hero-body">
          <div className="container content">
            <div className="section-header">
              <h1 className="title">Active projects</h1>
              <Link className="link-more" to="/projects/">
                All projects →
              </Link>
            </div>
            <ActiveProjects />
          </div>
        </div>
      </section>

      <section id="funded" className="section" ref={fundedRef}>
        <div className="container content">
          <h2>Funded by</h2>
          <FundedBy />
        </div>
      </section>

      <section id="news" className="section" ref={newsRef}>
        <div className="container content">
          <h2>News</h2>
          <News paginate={false} />
        </div>
      </section>
    </Layout>
  );
}
