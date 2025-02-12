import { Card } from '@automattic/components';
import { ToggleControl } from '@wordpress/components';
import classnames from 'classnames';
import { localize } from 'i18n-calypso';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import FormFieldset from 'calypso/components/forms/form-fieldset';
import FormSettingExplanation from 'calypso/components/forms/form-setting-explanation';
import FormTextInput from 'calypso/components/forms/form-text-input';
import InlineSupportLink from 'calypso/components/inline-support-link';
import SupportInfo from 'calypso/components/support-info';
import { requestAdminMenu } from 'calypso/state/admin-menu/actions';
import { activateModule } from 'calypso/state/jetpack/modules/actions';
import isActivatingJetpackModule from 'calypso/state/selectors/is-activating-jetpack-module';
import isJetpackModuleActive from 'calypso/state/selectors/is-jetpack-module-active';
import { isJetpackSite } from 'calypso/state/sites/selectors';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';

import './style.scss';

class CustomContentTypes extends Component {
	componentDidUpdate( prevProps ) {
		const {
			activatingCustomContentTypesModule,
			customContentTypesModuleActive,
			fields,
			isSavingSettings,
			siteId,
			siteIsJetpack,
		} = this.props;

		// Refresh menu after settings are saved in case CPTs have been registered or unregistered.
		if ( ! isSavingSettings && prevProps.isSavingSettings ) {
			this.props.requestAdminMenu( siteId );
		}

		if ( ! siteIsJetpack ) {
			return;
		}

		if ( customContentTypesModuleActive !== false ) {
			return;
		}

		if ( ! fields.jetpack_portfolio && ! fields.jetpack_testimonial ) {
			return;
		}

		if ( activatingCustomContentTypesModule ) {
			return;
		}

		this.props.activateModule( siteId, 'custom-content-types', true );
	}

	isFormPending() {
		const { isRequestingSettings, isSavingSettings } = this.props;

		return isRequestingSettings || isSavingSettings;
	}

	renderContentTypeSettings( name, label, description ) {
		const {
			activatingCustomContentTypesModule,
			fields,
			handleAutosavingToggle,
			onChangeField,
			translate,
		} = this.props;
		const numberFieldIdentifier = name === 'post' ? 'posts_per_page' : name + '_posts_per_page';
		const isDisabled = this.isFormPending() || ( ! fields[ name ] && name !== 'post' );
		const hasToggle = name !== 'post';

		return (
			<div className="custom-content-types__module-settings">
				{ hasToggle ? (
					<ToggleControl
						checked={ !! fields[ name ] }
						disabled={ this.isFormPending() || activatingCustomContentTypesModule }
						onChange={ handleAutosavingToggle( name ) }
						label={ <span className="custom-content-types__label">{ label }</span> }
					/>
				) : (
					<div
						id={ numberFieldIdentifier }
						className={ classnames( 'custom-content-types__label', {
							'indented-form-field': ! hasToggle,
						} ) }
					>
						{ label }
					</div>
				) }
				<div className="custom-content-types__indented-form-field indented-form-field">
					{ translate( 'Display {{field /}} per page', {
						comment:
							'The field value is a number that refers to site content type, e.g., blog post, testimonial or portfolio project',
						components: {
							field: (
								<FormTextInput
									name={ numberFieldIdentifier }
									type="number"
									step="1"
									min="0"
									aria-labelledby={ numberFieldIdentifier }
									value={
										'undefined' === typeof fields[ numberFieldIdentifier ]
											? 10
											: fields[ numberFieldIdentifier ]
									}
									onChange={ onChangeField( numberFieldIdentifier ) }
									disabled={ isDisabled }
								/>
							),
						},
					} ) }
				</div>
				<FormSettingExplanation isIndented>{ description }</FormSettingExplanation>
			</div>
		);
	}

	renderBlogPostSettings() {
		const { translate } = this.props;
		const fieldLabel = translate( 'Blog posts' );
		const fieldDescription = translate( 'On blog pages, the number of posts to show per page.' );

		return (
			<div className="custom-content-types__module-settings">
				{ this.renderContentTypeSettings( 'post', fieldLabel, fieldDescription ) }
			</div>
		);
	}

	renderTestimonialSettings() {
		const { translate } = this.props;
		const fieldLabel = translate( 'Testimonials' );
		const fieldDescription = translate(
			'Add, organize, and display {{link}}testimonials{{/link}}. If your theme doesn’t support testimonials yet, ' +
				'you can display them using the shortcode [testimonials].',
			{
				components: {
					link: <InlineSupportLink supportContext="testimonials" />,
				},
			}
		);

		return this.renderContentTypeSettings( 'jetpack_testimonial', fieldLabel, fieldDescription );
	}

	renderPortfolioSettings() {
		const { translate } = this.props;
		const fieldLabel = translate( 'Portfolio projects' );
		const fieldDescription = translate(
			'Add, organize, and display {{link}}portfolio projects{{/link}}. If your theme doesn’t support portfolio projects yet, ' +
				'you can display them using the shortcode [portfolio].',
			{
				components: {
					link: <InlineSupportLink supportContext="portfolios" />,
				},
			}
		);

		return this.renderContentTypeSettings( 'jetpack_portfolio', fieldLabel, fieldDescription );
	}

	render() {
		const { translate } = this.props;
		return (
			<Card className="custom-content-types site-settings">
				<FormFieldset>{ this.renderBlogPostSettings() }</FormFieldset>

				<FormFieldset>
					<SupportInfo
						text={ translate(
							'Adds the Testimonial custom post type, allowing you to collect, organize, ' +
								'and display testimonials on your site.'
						) }
						link="https://jetpack.com/support/custom-content-types/"
					/>
					{ this.renderTestimonialSettings() }
				</FormFieldset>

				<FormFieldset>
					<SupportInfo
						text={ translate(
							'Adds the Portfolio custom post type, allowing you to ' +
								'manage and showcase projects on your site.'
						) }
						link="https://jetpack.com/support/custom-content-types/"
					/>
					{ this.renderPortfolioSettings() }
				</FormFieldset>
			</Card>
		);
	}
}

CustomContentTypes.defaultProps = {
	isSavingSettings: false,
	isRequestingSettings: true,
	fields: {},
};

CustomContentTypes.propTypes = {
	handleAutosavingToggle: PropTypes.func.isRequired,
	onChangeField: PropTypes.func.isRequired,
	isSavingSettings: PropTypes.bool,
	isRequestingSettings: PropTypes.bool,
	fields: PropTypes.object,
};

export default connect(
	( state ) => {
		const siteId = getSelectedSiteId( state );

		return {
			siteId,
			siteIsJetpack: isJetpackSite( state, siteId ),
			customContentTypesModuleActive: isJetpackModuleActive(
				state,
				siteId,
				'custom-content-types'
			),
			activatingCustomContentTypesModule: isActivatingJetpackModule(
				state,
				siteId,
				'custom-content-types'
			),
		};
	},
	{
		activateModule,
		requestAdminMenu,
	}
)( localize( CustomContentTypes ) );
