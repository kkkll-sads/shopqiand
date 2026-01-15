import React from 'react';
import AboutUs from '../../../pages/cms/AboutUs';
import { withNavigation } from '../../hoc/withNavigation';

const AboutUsWithNav = withNavigation(AboutUs);

const AboutUsWrapper: React.FC = () => <AboutUsWithNav />;

export default AboutUsWrapper;
