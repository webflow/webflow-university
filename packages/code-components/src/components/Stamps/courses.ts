import thumbAiGuardrails from '../../assets/courses/01-ai-guardrails.jpg';
import thumbReviewers from '../../assets/courses/02-reviewers.jpg';
import thumbMarketers from '../../assets/courses/03-marketers.jpg';
import thumbCollaborate from '../../assets/courses/04-collaborate.jpg';
import thumbIntegrations from '../../assets/courses/05-integrations.jpg';
import thumbForms from '../../assets/courses/06-forms.jpg';
import thumbCustomCode from '../../assets/courses/07-custom-code.jpg';
import thumbSeo from '../../assets/courses/08-seo.jpg';
import thumbContentEditors from '../../assets/courses/09-content-editors.jpg';
import thumbInteractions from '../../assets/courses/10-interactions.jpg';

export interface CourseStamp {
  title: string;
  image: string;
  url: string;
}

/** First 10 courses from https://university.webflow.com/courses */
export const COURSE_STAMPS: CourseStamp[] = [
  {
    title: 'AI guardrails for teams',
    image: thumbAiGuardrails,
    url: 'https://university.webflow.com/courses',
  },
  {
    title: 'Webflow for Reviewers',
    image: thumbReviewers,
    url: 'https://university.webflow.com/courses',
  },
  {
    title: 'Webflow for Marketers',
    image: thumbMarketers,
    url: 'https://university.webflow.com/courses',
  },
  {
    title: 'Collaborate with your team',
    image: thumbCollaborate,
    url: 'https://university.webflow.com/courses',
  },
  {
    title: 'Intro to Webflow integrations',
    image: thumbIntegrations,
    url: 'https://university.webflow.com/courses',
  },
  {
    title: 'Forms',
    image: thumbForms,
    url: 'https://university.webflow.com/courses',
  },
  {
    title: 'Custom code in Webflow',
    image: thumbCustomCode,
    url: 'https://university.webflow.com/courses',
  },
  {
    title: 'Webflow SEO fundamentals',
    image: thumbSeo,
    url: 'https://university.webflow.com/courses',
  },
  {
    title: 'Webflow for Content editors',
    image: thumbContentEditors,
    url: 'https://university.webflow.com/courses',
  },
  {
    title: 'Interactions & animations',
    image: thumbInteractions,
    url: 'https://university.webflow.com/courses',
  },
];
