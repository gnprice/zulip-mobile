/* @flow strict-local */

import React, { PureComponent } from 'react';

import { caseNarrow, asApiStringNarrow } from '../utils/narrow';

import type { NarrowBridge, EditMessage } from '../types';
import TitlePrivate from './TitlePrivate';
import TitleGroup from './TitleGroup';
import TitleSpecial from './TitleSpecial';
import TitleStream from './TitleStream';
import TitlePlain from './TitlePlain';

type Props = $ReadOnly<{|
  narrow: NarrowBridge,
  color: string,
  editMessage: EditMessage | null,
|}>;

export default class Title extends PureComponent<Props> {
  render() {
    const { narrow: narrowBridge, color, editMessage } = this.props;
    if (editMessage != null) {
      return <TitlePlain text="Edit message" color={color} />;
    }
    const narrow = asApiStringNarrow(narrowBridge);
    return caseNarrow(narrow, {
      home: () => <TitleSpecial code="home" color={color} />,
      starred: () => <TitleSpecial code="starred" color={color} />,
      mentioned: () => <TitleSpecial code="mentioned" color={color} />,
      allPrivate: () => <TitleSpecial code="private" color={color} />,
      stream: () => <TitleStream narrow={narrow} color={color} />,
      topic: () => <TitleStream narrow={narrow} color={color} />,
      pm: email => <TitlePrivate email={email} color={color} />,
      groupPm: () => <TitleGroup narrow={narrow} />,
      search: () => null,
    });
  }
}
