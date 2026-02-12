import { ActionModalState, ActionModalEvent } from './types';

export const ACTION_MODAL_TRANSITIONS = {
  [ActionModalState.CLOSED]: {
    [ActionModalEvent.OPEN_DELIVERY]: ActionModalState.OPEN_DELIVERY,
    [ActionModalEvent.OPEN_CONSIGNMENT]: ActionModalState.OPEN_CONSIGNMENT,
  },
  [ActionModalState.OPEN_DELIVERY]: {
    [ActionModalEvent.SWITCH_TO_CONSIGNMENT]: ActionModalState.OPEN_CONSIGNMENT,
    [ActionModalEvent.SUBMIT]: ActionModalState.SUBMITTING,
    [ActionModalEvent.CLOSE]: ActionModalState.CLOSED,
  },
  [ActionModalState.OPEN_CONSIGNMENT]: {
    [ActionModalEvent.SWITCH_TO_DELIVERY]: ActionModalState.OPEN_DELIVERY,
    [ActionModalEvent.SUBMIT]: ActionModalState.SUBMITTING,
    [ActionModalEvent.CLOSE]: ActionModalState.CLOSED,
  },
  [ActionModalState.SUBMITTING]: {
    [ActionModalEvent.SUBMIT_SUCCESS]: ActionModalState.CLOSED,
    [ActionModalEvent.SUBMIT_ERROR]: ActionModalState.OPEN_DELIVERY,
    [ActionModalEvent.CLOSE]: ActionModalState.CLOSED,
  },
};
