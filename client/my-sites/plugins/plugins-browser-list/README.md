# Plugins Browser List

This component is used to display a list with the a parametrizable number of plugins of a certain category of the wordpress.org public plugin directory.

## How to use

```js
import { localize } from 'i18n-calypso';
import React from 'react';
import PluginsList from 'calypso/my-sites/plugins/plugins-browser-list';

const MyPluginsList = ( { pluginsData, translate } ) => (
	<div>
		<PluginsList
			plugins={ pluginsData }
			title={ translate( 'category name' ) }
			size={ 6 }
			site={ site }
			addPlaceHolders
		/>
	</div>
);

export default localize( MyPluginsList );
```

## Props

- `title`: a string
- `plugins`: a PluginsData object
- `size`: a number, the amount of plugins to be shown
- `site`: a string containing the slug of the selected site
- `addPlaceholders`: if present, indicates that there should placeholders inserted after the real components list
- `paginated`: the component can be used with pagination or infinite scroll, if set to true, it will replace all the rendered items with placeholders while loading
