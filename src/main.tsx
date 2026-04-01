/**
 * Entry point for the Value Framework POC extension.
 *
 * Mounts the React application into the DOM. The Akeneo Extension SDK sandbox
 * does not provide a pre-existing root element, so one is created if absent.
 *
 * The global `PIM` object is injected at runtime by the PIM shell — no import
 * or registration call is required.
 */

import { StrictMode } from 'react';
import ReactDOM from 'react-dom';
import { ValueFrameworkApp } from './ValueFrameworkApp';

if (!document.getElementById('root')) {
  document.body.innerHTML = '<div id="root"></div>';
}

ReactDOM.render(
  <StrictMode>
    <ValueFrameworkApp />
  </StrictMode>,
  document.getElementById('root'),
);
