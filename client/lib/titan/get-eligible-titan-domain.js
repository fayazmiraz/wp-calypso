import { canCurrentUserAddEmail } from 'calypso/lib/domains';
import { hasTitanMailWithUs } from 'calypso/lib/titan/has-titan-mail-with-us';

/**
 * Retrieves the first domain that is eligible to Titan in this order:
 *
 *   - The domain from the site currently selected, if eligible
 *   - The primary domain of the site, if eligible
 *   - The first non-primary domain eligible found
 *
 * Note this method doesn't check if a domain is eligible to the 3-month free trial.
 *
 * @param {string} selectedDomainName - domain name for the site currently selected by the user
 * @param {Array} domains - list of domain objects
 * @returns {?object} - the first eligible domain found, null otherwise
 */
export function getEligibleTitanDomain( selectedDomainName, domains ) {
	if ( ! domains ) {
		return null;
	}

	const eligibleDomains = domains.filter( ( domain ) => {
		if ( domain.expired || domain.isWPCOMDomain ) {
			return false;
		}

		if ( hasTitanMailWithUs( domain ) ) {
			return false;
		}

		return canCurrentUserAddEmail( domain );
	} );

	if ( eligibleDomains.length === 0 ) {
		return null;
	}

	if ( selectedDomainName && eligibleDomains.includes( selectedDomainName ) ) {
		return selectedDomainName;
	}

	// Orders domains with the primary domain in first position, if any, and returns the first domain
	return eligibleDomains.sort( ( a, b ) => Number( a.isPrimary ) - Number( b.isPrimary ) )[ 0 ];
}
