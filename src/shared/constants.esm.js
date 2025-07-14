/**
 * @copyright 2025 Kappa Computer Solutions, LLC and Brian Katzung
 * @author Brian Katzung <briank@kappacs.com>
 * @license MIT
 *
 * This file contains shared constants used throughout the MWI system
 * to avoid magic strings and improve maintainability.
 */

// Feature Promises (for fwait/fready)
export const FEAT_REGISTRY_READY = 'mwi.registry.ready';
export const FEAT_COMPONENTS_READY = 'mwi.components.ready';
export const FEAT_COMPONENTS_PREFIX = 'mwi.components.';

// Interface Names
export const IF_COMPONENT_REGISTRY = 'MWIComponentRegistry';

// HTML Element IDs
export const ID_HYDRATION_SCRIPT = 'mwiHydration';
export const ID_MODULES_SCRIPT = 'mwiModules';