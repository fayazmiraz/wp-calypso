import { CompactCard } from '@automattic/components';
import { localize } from 'i18n-calypso';
import { isEmpty } from 'lodash';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import QueryHelpLinks from 'calypso/components/data/query-help-links';
import SearchCard from 'calypso/components/search-card';
import { localizeUrl } from 'calypso/lib/i18n-utils';
import HelpResults from 'calypso/me/help/help-results';
import NoResults from 'calypso/my-sites/no-results';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import getHelpLinks from 'calypso/state/selectors/get-help-links';

import './style.scss';

export class HelpSearch extends PureComponent {
	state = {
		searchQuery: '',
	};

	onSearch = ( searchQuery ) => {
		this.setState( {
			searchQuery,
		} );

		if ( isEmpty( searchQuery ) ) {
			this.props.onSearch( false );
		} else {
			this.props.onSearch( true );
		}

		this.props.recordTracksEvent( 'calypso_help_search', { query: searchQuery } );
	};

	displaySearchResults = () => {
		const { searchQuery } = this.state;
		const { helpLinks, translate } = this.props;

		if ( isEmpty( searchQuery ) ) {
			return null;
		}

		if ( isEmpty( helpLinks ) ) {
			/* eslint-disable wpcalypso/jsx-classname-namespace */
			return (
				<div className="help-results__placeholder">
					<HelpResults
						header="..."
						helpLinks={ [
							{
								title: '',
								description: '',
								link: '#',
								disabled: true,
							},
						] }
						footer="..."
						iconTypeDescription=""
						searchLink="#"
					/>
				</div>
			);
		}

		if (
			isEmpty( helpLinks.wordpress_support_links ) &&
			isEmpty( helpLinks.wordpress_forum_links ) &&
			isEmpty( helpLinks.wordpress_forum_links_localized ) &&
			isEmpty( helpLinks.jetpack_support_links )
		) {
			return (
				<CompactCard className="help-search__no-results">
					<NoResults
						text={ translate( 'No results found for {{em}}%(searchQuery)s{{/em}}', {
							args: { searchQuery },
							components: { em: <em /> },
						} ) }
					/>
				</CompactCard>
			);
		}

		const forumBaseUrl = helpLinks.wordpress_forum_links_localized
			? localizeUrl( 'https://wordpress.com/forums' )
			: 'https://wordpress.com/forums';

		return (
			<div>
				<HelpResults
					footer={ translate( 'See more from WordPress.com Documentation…' ) }
					header={ translate( 'WordPress.com Documentation' ) }
					helpLinks={ helpLinks.wordpress_support_links }
					iconTypeDescription="book"
					searchLink={ 'https://wordpress.com/support?s=' + searchQuery }
				/>
				<HelpResults
					footer={ translate( 'See more from Community Forum…' ) }
					header={ translate( 'Community Answers' ) }
					helpLinks={ helpLinks.wordpress_forum_links_localized || helpLinks.wordpress_forum_links }
					iconTypeDescription="comment"
					searchLink={ `${ forumBaseUrl }?s=${ searchQuery }` }
				/>
				<HelpResults
					footer={ translate( 'See more from Jetpack Documentation…' ) }
					header={ translate( 'Jetpack Documentation' ) }
					helpLinks={ helpLinks.jetpack_support_links }
					iconTypeDescription="jetpack"
					searchLink="https://jetpack.me/support/"
				/>
			</div>
		);
	};

	render() {
		const { searchQuery } = this.state;

		return (
			<div className="help-search">
				<QueryHelpLinks query={ searchQuery } />
				<SearchCard
					analyticsGroup="Help"
					delaySearch={ true }
					initialValue=""
					onSearch={ this.onSearch }
					placeholder={ this.props.translate( 'How can we help?' ) }
				/>
				{ this.displaySearchResults() }
			</div>
		);
	}
}

export default connect(
	( state ) => ( {
		helpLinks: getHelpLinks( state ),
	} ),
	{
		recordTracksEvent,
	}
)( localize( HelpSearch ) );
