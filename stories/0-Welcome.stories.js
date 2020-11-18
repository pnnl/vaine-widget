import React from 'react';
import { VaneWidget } from '../src';

import { formatData } from '../src/helperFunctions/formatData'
import { formatStats } from '../src/helperFunctions/formatStats'

import props from './data/props.json'
import stats from './data/stats.json'

export default {
  title: 'Overall',
};

export const ToStorybook = () => (
	<VaneWidget data={props.data}
		  treatments={props.treatments}
		  outcomes={props.outcomes}
		  ignore={props.ignore}
		  latentRepresentation={props.latentRepresentation} />
)

ToStorybook.story = {
  name: 'to Storybook',
};
