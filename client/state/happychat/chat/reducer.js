/* eslint-disable no-case-declarations */

import { concat, filter, find, findIndex, map, get, sortBy } from 'lodash';
import {
	HAPPYCHAT_IO_RECEIVE_MESSAGE,
	HAPPYCHAT_IO_RECEIVE_MESSAGE_OPTIMISTIC,
	HAPPYCHAT_IO_RECEIVE_MESSAGE_UPDATE,
	HAPPYCHAT_IO_RECEIVE_STATUS,
	HAPPYCHAT_IO_REQUEST_TRANSCRIPT_RECEIVE,
	HAPPYCHAT_IO_REQUEST_TRANSCRIPT_TIMEOUT,
	HAPPYCHAT_IO_SEND_MESSAGE_MESSAGE,
} from 'calypso/state/action-types';
import {
	HAPPYCHAT_CHAT_STATUS_DEFAULT,
	HAPPYCHAT_MAX_STORED_MESSAGES,
} from 'calypso/state/happychat/constants';
import { combineReducers, withSchemaValidation, withPersistence } from 'calypso/state/utils';
import { timelineSchema } from './schema';

// We compare incoming timestamps against a known future Unix time in seconds date
// to determine if the timestamp is in seconds or milliseconds resolution. If the former,
// we "upgrade" it by multiplying by 1000.
//
// This will all be removed once the server-side is fully converted.
const UNIX_TIMESTAMP_2023_IN_SECONDS = 1700000000;
export const maybeUpscaleTimePrecision = ( time ) =>
	time < UNIX_TIMESTAMP_2023_IN_SECONDS ? time * 1000 : time;

const lastActivityTimestampSchema = { type: 'number' };
export const lastActivityTimestamp = withSchemaValidation(
	lastActivityTimestampSchema,
	( state = null, action ) => {
		switch ( action.type ) {
			case HAPPYCHAT_IO_SEND_MESSAGE_MESSAGE:
			case HAPPYCHAT_IO_RECEIVE_MESSAGE:
				return Date.now();
		}
		return state;
	}
);

/**
 * Tracks the state of the happychat chat. Valid states are:
 *
 *  - HAPPYCHAT_CHAT_STATUS_DEFAULT : no chat has been started
 *  - HAPPYCHAT_CHAT_STATUS_PENDING : chat has been started but no operator assigned
 *  - HAPPYCHAT_CHAT_STATUS_ASSIGNING : system is assigning to an operator
 *  - HAPPYCHAT_CHAT_STATUS_ASSIGNED : operator has been connected to the chat
 *  - HAPPYCHAT_CHAT_STATUS_MISSED : no operator could be assigned
 *  - HAPPYCHAT_CHAT_STATUS_ABANDONED : operator was disconnected
 *  - HAPPYCHAT_CHAT_STATUS_CLOSED : chat was closed
 *
 * @param  {object} state  Current state
 * @param  {object} action Action payload
 * @returns {object}        Updated state
 *
 */
export const status = ( state = HAPPYCHAT_CHAT_STATUS_DEFAULT, action ) => {
	switch ( action.type ) {
		case HAPPYCHAT_IO_RECEIVE_STATUS:
			return action.status;
	}
	return state;
};

/**
 * Returns a timeline event from the redux action
 *
 * @param  {object} state  Current state
 * @param  {object} action Action payload
 * @returns {object}        Updated state
 *
 */
const timelineEvent = ( state = {}, action ) => {
	switch ( action.type ) {
		case HAPPYCHAT_IO_RECEIVE_MESSAGE:
		case HAPPYCHAT_IO_RECEIVE_MESSAGE_OPTIMISTIC:
		case HAPPYCHAT_IO_RECEIVE_MESSAGE_UPDATE:
			const { message } = action;
			return {
				id: message.id,
				source: message.source,
				message: message.text,
				name: message.user.name,
				image: message.user.avatarURL,
				isEdited: !! message.revisions,
				isOptimistic: message.isOptimistic,
				timestamp: maybeUpscaleTimePrecision( message.timestamp ),
				user_id: message.user.id,
				type: get( message, 'type', 'message' ),
				links: get( message, 'meta.links' ),
			};
	}
	return state;
};

const sortTimeline = ( timeline ) =>
	sortBy( timeline, ( event ) => parseInt( event.timestamp, 10 ) );

/**
 * Adds timeline events for happychat
 *
 * @param  {object} state  Current state
 * @param  {object} action Action payload
 * @returns {object}        Updated state
 *
 */
const timelineReducer = ( state = [], action ) => {
	switch ( action.type ) {
		case HAPPYCHAT_IO_RECEIVE_MESSAGE:
		case HAPPYCHAT_IO_RECEIVE_MESSAGE_OPTIMISTIC:
			// if meta.forOperator is set, skip so won't show to user
			if ( get( action, 'message.meta.forOperator', false ) ) {
				return state;
			}
			const event = timelineEvent( {}, action );

			// If the message already exists in the timeline, replace it
			const idx = findIndex( state, ( { id } ) => event.id === id );
			if ( idx >= 0 ) {
				return [ ...state.slice( 0, idx ), event, ...state.slice( idx + 1 ) ];
			}

			// This is a new message — append it!
			return concat( state, [ event ] );

		case HAPPYCHAT_IO_RECEIVE_MESSAGE_UPDATE:
			const index = findIndex( state, ( { id } ) => action.message.id === id );
			return index === -1
				? state
				: [ ...state.slice( 0, index ), timelineEvent( {}, action ), ...state.slice( index + 1 ) ];
		case HAPPYCHAT_IO_REQUEST_TRANSCRIPT_TIMEOUT:
			return state;
		case HAPPYCHAT_IO_REQUEST_TRANSCRIPT_RECEIVE:
			const messages = filter( action.messages, ( message ) => {
				if ( ! message.id ) {
					return false;
				}

				// if meta.forOperator is set, skip so won't show to user
				if ( get( message, 'meta.forOperator', false ) ) {
					return false;
				}

				return ! find( state, { id: message.id } );
			} );
			return sortTimeline(
				state.concat(
					map( messages, ( message ) => ( {
						id: message.id,
						source: message.source,
						message: message.text,
						name: message.user.name,
						image: message.user.picture,
						isEdited: !! message.revisions,
						timestamp: maybeUpscaleTimePrecision( message.timestamp ),
						user_id: message.user.id,
						type: get( message, 'type', 'message' ),
						links: get( message, 'meta.links' ),
					} ) )
				)
			);
	}
	return state;
};

export const timeline = withSchemaValidation(
	timelineSchema,
	withPersistence( timelineReducer, {
		serialize: ( state ) => state.slice( -1 * HAPPYCHAT_MAX_STORED_MESSAGES ),
	} )
);

export default combineReducers( {
	status,
	timeline,
	lastActivityTimestamp,
} );
