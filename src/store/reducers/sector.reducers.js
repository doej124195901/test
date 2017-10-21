import Chance from 'chance';
import { omit } from 'lodash';

import { LOCATION_CHANGE } from 'react-router-redux';
import sectorGenerator from 'utils/sector-generator';
import { generateSectorName } from 'utils/name-generator';
import {
  ADD_SAVED_SECTOR,
  REMOVE_SAVED_SECTOR,
  EDIT_SECTOR,
  UPDATE_CONFIGURATION,
} from 'store/actions/sector.actions';
import { EDIT_PLANET, DELETE_PLANET } from 'store/actions/planet.actions';
import { INITIALIZE, LOGGED_IN, LOGGED_OUT } from 'store/actions/user.actions';

const initialState = {
  renderSector: false,
  currentSector: null,
  generated: null,
  saved: {},
  configuration: {
    name: generateSectorName(new Chance()),
    isBuilder: false,
    columns: 8,
    rows: 10,
  },
};

export default function sector(state = initialState, action) {
  switch (action.type) {
    case LOGGED_IN:
    case INITIALIZE: {
      let generated = state.generated;
      let currentSector = state.currentSector;
      if (!!state.generated && !!action.sectors[state.generated.key]) {
        generated = null;
        currentSector = state.generated.key;
      }
      return {
        ...state,
        generated,
        currentSector,
        saved: action.sectors,
      };
    }
    case LOGGED_OUT:
      return {
        ...state,
        ...initialState,
      };
    case UPDATE_CONFIGURATION:
      return {
        ...state,
        configuration: {
          ...state.configuration,
          [action.key]: action.value,
        },
      };
    case ADD_SAVED_SECTOR: {
      return {
        ...state,
        currentSector: action.sector.key,
        generated: null,
        saved: {
          ...state.saved,
          [action.sector.key]: action.sector,
        },
      };
    }
    case REMOVE_SAVED_SECTOR:
      return {
        ...state,
        saved: omit(state.saved, action.key),
      };
    case EDIT_SECTOR: {
      return {
        ...state,
        currentSector: action.sector.key,
        generated: null,
        saved: {
          ...state.saved,
          [action.sector.key]: action.sector,
        },
      };
    }
    case LOCATION_CHANGE: {
      const { pathname } = action.payload;
      if (['/', '/configure'].indexOf(pathname) >= 0) {
        return {
          ...initialState,
          saved: state.saved,
        };
      }
      if (pathname.startsWith('/sector/')) {
        const pathArray = pathname.split('/');
        const key = pathArray[2];

        const update = { renderSector: true };
        if (!state.currentSector) {
          const saved = state.saved[key];
          if (saved) {
            update.currentSector = key;
          } else if (!state.generated) {
            update.currentSector = 'generated';
            update.generated = sectorGenerator({
              ...state.configuration,
              key,
            });
          }
        }
        return {
          ...state,
          renderSector: true,
          ...update,
        };
      }
      return {
        ...state,
        renderSector: false,
      };
    }
    case EDIT_PLANET: {
      const existingSector =
        state.generated || state.saved[state.currentSector];
      return {
        ...state,
        currentSector: existingSector.key,
        generated: null,
        saved: {
          ...state.saved,
          [existingSector.key]: {
            ...existingSector,
            systems: {
              ...existingSector.systems,
              [action.system]: {
                ...existingSector.systems[action.system],
                planets: {
                  ...omit(
                    existingSector.systems[action.system].planets,
                    action.planet,
                  ),
                  [action.newKey]: action.update,
                },
              },
            },
          },
        },
      };
    }
    case DELETE_PLANET: {
      const existingSector =
        state.generated || state.saved[state.currentSector];
      return {
        ...state,
        currentSector: existingSector.seed,
        generated: null,
        saved: {
          ...state.saved,
          [existingSector.seed]: {
            ...existingSector,
            systems: {
              ...existingSector.systems,
              [action.system]: {
                ...existingSector.systems[action.system],
                planets: omit(
                  existingSector.systems[action.system].planets,
                  action.planet,
                ),
              },
            },
          },
        },
      };
    }
    default:
      return state;
  }
}
