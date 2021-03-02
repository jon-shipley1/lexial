/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

import type {RootNode, OutlineNode} from 'outline';

import {TextNode, BlockNode} from 'outline';

let _graphemeIterator = null;
// $FlowFixMe: Missing a Flow type for `Intl.Segmenter`.
function getGraphemeIterator(): Intl.Segmenter {
  if (_graphemeIterator === null) {
    _graphemeIterator =
      // $FlowFixMe: Missing a Flow type for `Intl.Segmenter`.
      new Intl.Segmenter(undefined /* locale */, {granularity: 'grapheme'});
  }
  return _graphemeIterator;
}

export function findTextIntersectionFromCharacters(
  root: RootNode,
  targetCharacters: number,
): null | {node: TextNode, offset: number} {
  let node = root.getFirstChild();
  let currentCharacters = 0;

  mainLoop: while (node !== null) {
    if (node instanceof BlockNode) {
      const child = node.getFirstChild();
      if (child !== null) {
        node = child;
        continue;
      }
    } else if (node instanceof TextNode) {
      const characters = node.getTextContent().length;

      if (currentCharacters + characters > targetCharacters) {
        return {node, offset: targetCharacters - currentCharacters};
      }
      currentCharacters += characters;
    }
    const sibling = node.getNextSibling();
    if (sibling !== null) {
      node = sibling;
      continue;
    }
    let parent = node.getParent();
    while (parent !== null) {
      const parentSibling = parent.getNextSibling();
      if (parentSibling !== null) {
        node = parentSibling;
        continue mainLoop;
      }
      parent = parent.getParent();
    }
    break;
  }
  return null;
}

export function announceString(s: string): void {
  const body = document.body;
  if (body != null) {
    const announce = document.createElement('div');
    announce.setAttribute('id', 'outline_announce_' + Date.now());
    announce.setAttribute('aria-live', 'polite');
    announce.style.cssText =
      'clip: rect(0, 0, 0, 0); height: 1px; overflow: hidden; position: absolute; width: 1px';
    body.appendChild(announce);

    // The trick to make all screen readers to read the text is to create AND update an element with a unique id:
    // - JAWS remains silent without update
    // - VO remains silent without create, if the text is the same (and doing `announce.textContent=''` doesn't help)
    setTimeout(() => {
      announce.textContent = s;
    }, 100);

    setTimeout(() => {
      body.removeChild(announce);
    }, 500);
  }
}

function hasAtLeastTwoVisibleChars(s: string): boolean {
  try {
    const iterator = getGraphemeIterator().segment(s);
    return iterator.next() != null && iterator.next() != null;
  } catch {
    // TODO: Implement polyfill for `Intl.Segmenter`.
    return [...s].length > 1;
  }
}

export function announceNode(node: OutlineNode): void {
  if (
    node instanceof TextNode &&
    hasAtLeastTwoVisibleChars(node.getTextContent())
  ) {
    announceString(node.getTextContent());
  }
}