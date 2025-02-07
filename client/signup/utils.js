import config from '@automattic/calypso-config';
import { translate } from 'i18n-calypso';
import { filter, find, includes, isEmpty, pick, sortBy } from 'lodash';
import flows from 'calypso/signup/config/flows';
import steps from 'calypso/signup/config/steps-pure';

const { defaultFlowName } = flows;

function getDefaultFlowName() {
	return defaultFlowName;
}

export function getFlowName( parameters, isUserLoggedIn ) {
	return parameters.flowName && isFlowName( parameters.flowName, isUserLoggedIn )
		? parameters.flowName
		: getDefaultFlowName();
}

function isFlowName( pathFragment, isUserLoggedIn ) {
	return ! isEmpty( flows.getFlow( pathFragment, isUserLoggedIn ) );
}

export function getStepName( parameters ) {
	return find( pick( parameters, [ 'flowName', 'stepName' ] ), isStepName );
}

export function isFirstStepInFlow( flowName, stepName, isUserLoggedIn ) {
	const { steps: stepsBelongingToFlow } = flows.getFlow( flowName, isUserLoggedIn );
	return stepsBelongingToFlow.indexOf( stepName ) === 0;
}

function isStepName( pathFragment ) {
	return ! isEmpty( steps[ pathFragment ] );
}

export function getStepSectionName( parameters ) {
	return find( pick( parameters, [ 'stepName', 'stepSectionName' ] ), isStepSectionName );
}

function isStepSectionName( pathFragment ) {
	return ! isStepName( pathFragment );
}

export function getStepUrl( flowName, stepName, stepSectionName, localeSlug ) {
	const flow = flowName ? `/${ flowName }` : '';
	const step = stepName ? `/${ stepName }` : '';
	const section = stepSectionName ? `/${ stepSectionName }` : '';
	const locale = localeSlug ? `/${ localeSlug }` : '';

	if ( flowName === defaultFlowName ) {
		// we don't include the default flow name in the route
		return '/start' + step + section + locale;
	}

	return '/start' + flow + step + section + locale;
}

export function getValidPath( parameters, isUserLoggedIn ) {
	const locale = parameters.lang;
	const flowName = getFlowName( parameters, isUserLoggedIn );
	const currentFlowSteps = flows.getFlow( flowName, isUserLoggedIn ).steps;
	const stepName = getStepName( parameters ) || currentFlowSteps[ 0 ];
	const stepSectionName = getStepSectionName( parameters );

	if ( currentFlowSteps.length === 0 ) {
		return '/';
	}

	return getStepUrl( flowName, stepName, stepSectionName, locale );
}

export function getPreviousStepName( flowName, currentStepName, isUserLoggedIn ) {
	const flow = flows.getFlow( flowName, isUserLoggedIn );
	return flow.steps[ flow.steps.indexOf( currentStepName ) - 1 ];
}

export function getNextStepName( flowName, currentStepName, isUserLoggedIn ) {
	const flow = flows.getFlow( flowName, isUserLoggedIn );
	return flow.steps[ flow.steps.indexOf( currentStepName ) + 1 ];
}

export function getFlowSteps( flowName, isUserLoggedIn ) {
	const flow = flows.getFlow( flowName, isUserLoggedIn );
	return flow.steps;
}

export function getFlowPageTitle( flowName, isUserLoggedIn ) {
	const flow = flows.getFlow( flowName, isUserLoggedIn );
	return flow.pageTitle || translate( 'Create a site' );
}

export function getValueFromProgressStore( { signupProgress, stepName, fieldName } ) {
	const siteStepProgress = find( signupProgress, ( step ) => step.stepName === stepName );
	return siteStepProgress ? siteStepProgress[ fieldName ] : null;
}

export function getDestination( destination, dependencies, flowName, localeSlug ) {
	return flows.filterDestination( destination, dependencies, flowName, localeSlug );
}

export function getThemeForDesignType( designType ) {
	switch ( designType ) {
		case 'blog':
			return 'pub/independent-publisher-2';
		case 'grid':
			return 'pub/altofocus';
		case 'page':
			return 'pub/dara';
		case 'store':
			return 'pub/dara';
		default:
			return 'pub/twentyseventeen';
	}
}

export function getThemeForSiteGoals( siteGoals ) {
	const siteGoalsValue = siteGoals.split( ',' );

	if ( siteGoalsValue.indexOf( 'sell' ) !== -1 ) {
		return 'pub/radcliffe-2';
	}

	if ( siteGoalsValue.indexOf( 'promote' ) !== -1 ) {
		return 'pub/radcliffe-2';
	}

	if ( siteGoalsValue.indexOf( 'educate' ) !== -1 ) {
		return 'pub/twentyfifteen';
	}

	if ( siteGoalsValue.indexOf( 'showcase' ) !== -1 ) {
		return 'pub/altofocus';
	}

	return 'pub/independent-publisher-2';
}

export function getDesignTypeForSiteGoals( siteGoals, flow ) {
	const siteGoalsValue = siteGoals.split( ',' );

	//Identify stores for the store signup flow
	if ( siteGoals === 'sell' || flow === 'ecommerce' ) {
		return 'store';
	}

	if ( siteGoalsValue.indexOf( 'sell' ) !== -1 ) {
		return 'page';
	}

	if ( siteGoalsValue.indexOf( 'promote' ) !== -1 ) {
		return 'page';
	}

	if ( siteGoalsValue.indexOf( 'showcase' ) !== -1 ) {
		return 'portfolio';
	}

	return 'blog';
}

export function getFilteredSteps( flowName, progress, isUserLoggedIn ) {
	const flow = flows.getFlow( flowName, isUserLoggedIn );

	if ( ! flow ) {
		return [];
	}

	return sortBy(
		// filter steps...
		filter( progress, ( step ) => includes( flow.steps, step.stepName ) ),
		// then order according to the flow definition...
		( { stepName } ) => flow.steps.indexOf( stepName )
	);
}

export function getFirstInvalidStep( flowName, progress, isUserLoggedIn ) {
	return find( getFilteredSteps( flowName, progress, isUserLoggedIn ), { status: 'invalid' } );
}

export function getCompletedSteps( flowName, progress, options = {}, isUserLoggedIn ) {
	// Option to check that the current `flowName` matches the `lastKnownFlow`.
	// This is to ensure that when resuming progress, we only do so if
	// the last known flow matches the one that the user is returning to.
	if ( options.shouldMatchFlowName ) {
		return filter(
			getFilteredSteps( flowName, progress, isUserLoggedIn ),
			( step ) => 'in-progress' !== step.status && step.lastKnownFlow === flowName
		);
	}
	return filter(
		getFilteredSteps( flowName, progress, isUserLoggedIn ),
		( step ) => 'in-progress' !== step.status
	);
}

export function canResumeFlow( flowName, progress, isUserLoggedIn ) {
	const flow = flows.getFlow( flowName, isUserLoggedIn );
	const flowStepsInProgressStore = getCompletedSteps(
		flowName,
		progress,
		{
			shouldMatchFlowName: true,
		},
		isUserLoggedIn
	);
	return flowStepsInProgressStore.length > 0 && ! flow.disallowResume;
}

export const shouldForceLogin = ( flowName, userLoggedIn ) => {
	const flow = flows.getFlow( flowName, userLoggedIn );
	return !! flow && flow.forceLogin;
};

export const isReskinnedFlow = ( flowName ) => {
	return config.isEnabled( 'signup/reskin' ) && config( 'reskinned_flows' ).includes( flowName );
};
