/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {
  InjectionToken,    // tslint:disable-line:no-unused-variable
  ComponentRef,      // tslint:disable-line:no-unused-variable
} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {BEFORE_APP_SERIALIZED} from '@angular/platform-server';

import {
  BreakPoint,
  BREAKPOINTS,
  CLASS_NAME,
  MatchMedia,
  ServerStylesheet,
  SERVER_TOKEN,
} from '@angular/flex-layout';

let UNIQUE_CLASS = 0;
const DEBUG_FLAG = false;

/**
 * create @media queries based on a virtual stylesheet
 * * Adds a unique class to each element and stores it
 *   in a shared classMap for later reuse
 */
function formatStyle(stylesheet: Map<HTMLElement, Map<string, string|number>>,
                     _document: Document,
                     mediaQuery: string,
                     classMap: Map<HTMLElement, string>) {
  let styleText = DEBUG_FLAG ? `
        @media ${mediaQuery} {` : `@media ${mediaQuery}{`;
  stylesheet.forEach((styles, el) => {
    let className = classMap.get(el);
    if (!className) {
      className = `${CLASS_NAME}${UNIQUE_CLASS++}`;
      classMap.set(el, className);
    }
    el.classList.add(className);
    styleText += DEBUG_FLAG ? `
          .${className} {` : `.${className}{`;
    styles.forEach((v, k) => {
      if (v) {
        styleText += DEBUG_FLAG ? `
              ${k}: ${v};` : `${k}:${v};`;
      }
    });
    styleText += DEBUG_FLAG ? `
          }` : '}';
  });
  styleText += DEBUG_FLAG ? `
        }\n` : '}';

  return styleText;
}

/**
 * Add or remove static styles depending on the current
 * platform
 * format the static @media queries for all breakpoints
 * to be used on the server and append them to the <head>
 */
export function addStyles(serverSheet: ServerStylesheet,
                          matchMedia: MatchMedia,
                          _document: Document,
                          breakpoints: BreakPoint[]) {
  // necessary because of angular/angular/issues/14485
  const res = () => {
    const styleTag = _document.createElement('style');
    const classMap = new Map<HTMLElement, string>();
    const defaultStyles = new Map(serverSheet.stylesheet);
    let styleText = formatStyle(defaultStyles, _document, 'all', classMap);

    breakpoints.reverse();
    breakpoints.forEach((bp, i) => {
      serverSheet.clearStyles();
      matchMedia.activateBreakpoint(bp);
      const stylesheet = new Map(serverSheet.stylesheet);
      if (stylesheet.size > 0) {
        styleText += formatStyle(stylesheet, _document, bp.mediaQuery, classMap);
      }
      matchMedia.deactivateBreakpoint(breakpoints[i]);
    });

    styleTag.classList.add(`${CLASS_NAME}ssr`);
    styleTag.textContent = styleText;
    _document.head.appendChild(styleTag);
  };

  return res;
}

/**
 *  Provider to set static styles on the server
 */
export const SERVER_PROVIDERS = [
  {
    provide: BEFORE_APP_SERIALIZED,
    useFactory: addStyles,
    deps: [
      ServerStylesheet,
      MatchMedia,
      DOCUMENT,
      BREAKPOINTS,
    ],
    multi: true
  },
  {
    provide: SERVER_TOKEN,
    useValue: true
  }
];
