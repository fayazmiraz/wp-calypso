import { sprintf } from '@wordpress/i18n';
import { useI18n } from '@wordpress/react-i18n';
import PropTypes from 'prop-types';
import { useRef, useState, useEffect } from 'react';
import { useInterval } from 'calypso/lib/interval/use-interval';
import './style.scss';

// Total time to perform "loading"
const DURATION_IN_MS = 6000;

const useSteps = ( { flowName, hasPaidDomain, hasAppliedDesign } ) => {
	const { __ } = useI18n();
	let steps = [];

	switch ( flowName ) {
		case 'launch-site':
			steps = [ __( 'Your site will be live shortly.' ) ]; // copy from 'packages/launch/src/focused-launch/success'
			break;
		case 'setup-site':
			steps = [ __( 'Applying design' ) ];
			break;
		default:
			steps = [
				__( 'Building your site' ),
				hasPaidDomain && __( 'Getting your domain' ),
				hasAppliedDesign && __( 'Applying design' ),
			];
	}

	return useRef( steps.filter( Boolean ) );
};

// This component is cloned from the CreateSite component of Gutenboarding flow
// to work with the onboarding signup flow.
export default function ReskinnedProcessingScreen( props ) {
	const { __ } = useI18n();

	const steps = useSteps( props );
	const totalSteps = steps.current.length;

	const [ currentStep, setCurrentStep ] = useState( 0 );

	/**
	 * Completion progress: 0 <= progress <= 1
	 */
	const progress = ( currentStep + 1 ) / totalSteps;
	const isComplete = progress >= 1;

	useInterval(
		() => setCurrentStep( ( s ) => s + 1 ),
		// Enable the interval when progress is incomplete
		isComplete ? null : DURATION_IN_MS / totalSteps
	);

	// Force animated progress bar to start at 0
	const [ hasStarted, setHasStarted ] = useState( false );
	useEffect( () => {
		const id = setTimeout( () => setHasStarted( true ), 750 );
		return () => clearTimeout( id );
	}, [] );

	return (
		<div className="reskinned-processing-screen">
			<h1 className="reskinned-processing-screen__progress-step">
				{ steps.current[ currentStep ] }
			</h1>
			<div
				className="reskinned-processing-screen__progress-bar"
				style={ {
					'--progress': ! hasStarted ? /* initial 10% progress */ 0.1 : progress,
				} }
			/>
			<p className="reskinned-processing-screen__progress-numbered-steps">
				{
					// translators: these are progress steps. Eg: step 1 of 4.
					sprintf( __( 'Step %(currentStep)d of %(totalSteps)d' ), {
						currentStep: currentStep + 1,
						totalSteps,
					} )
				}
			</p>
		</div>
	);
}

ReskinnedProcessingScreen.propTypes = {
	flowName: PropTypes.string,
	hasPaidDomain: PropTypes.bool,
	hasAppliedDesign: PropTypes.bool,
};
