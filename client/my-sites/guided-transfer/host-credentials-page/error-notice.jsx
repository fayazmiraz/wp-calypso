import { localize } from 'i18n-calypso';
import { connect } from 'react-redux';
import Notice from 'calypso/components/notice';
import NoticeAction from 'calypso/components/notice/notice-action';
import { CALYPSO_CONTACT } from 'calypso/lib/url/support';
import { getGuidedTransferError } from 'calypso/state/sites/guided-transfer/selectors';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';

const getErrorText = ( { translate, errorCode } ) => {
	switch ( errorCode ) {
		case 'exceeded-max-validation-attempts':
			return translate(
				"You've entered invalid details one too many times. Please contact support."
			);
		case 'verify-details-failed':
			return translate(
				'Those hosting details are incorrect. Please try again or contact support.'
			);
		case 'details-already-validated':
			return translate(
				"We've already confirmed your details. Please contact support if you need to change them."
			);
	}

	return translate( 'We had trouble saving your details. Please try again or contact support.' );
};

const ErrorNotice = localize( ( { translate, errorCode } ) => {
	if ( ! errorCode ) {
		return null;
	}

	return (
		<Notice
			showDismiss={ false }
			status="is-error"
			text={ getErrorText( { translate, errorCode } ) }
		>
			<NoticeAction href={ CALYPSO_CONTACT }>{ translate( 'Get Help' ) }</NoticeAction>
		</Notice>
	);
} );

export default connect( ( state ) => ( {
	errorCode: getGuidedTransferError( state, getSelectedSiteId( state ) ),
} ) )( ErrorNotice );
