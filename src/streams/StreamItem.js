/* @flow strict-local */
import React, { PureComponent } from 'react';
import { StyleSheet, View } from 'react-native';

import styles, { ThemeContext } from '../styles';
import type { ThemeColors } from '../styles';
import { RawLabel, Touchable, UnreadCount, ZulipSwitch } from '../common';
import { foregroundColorFromBackground } from '../utils/color';
import StreamIcon from './StreamIcon';

const componentStyles = StyleSheet.create({
  description: {
    opacity: 0.75,
    fontSize: 12,
  },
  text: {
    flex: 1,
    paddingLeft: 8,
    paddingRight: 8,
  },
  muted: {
    opacity: 0.5,
  },
});

type Props = {|
  name: string,
  description?: string,
  iconSize: number,
  isMuted: boolean,
  isPrivate: boolean,
  showSwitch: boolean,
  color?: string,
  backgroundColor?: string,
  isSwitchedOn: boolean,
  unreadCount?: number,
  onPress: (name: string) => void,
  onSwitch?: (name: string, newValue: boolean) => void,
|};

/**
 * A stream, in some list.
 *
 * The two props `color` and `backgroundColor` are incompatible.
 */
export default class StreamItem extends PureComponent<Props> {
  static contextType = ThemeContext;
  context: ThemeColors;

  static defaultProps = {
    isMuted: false,
    isPrivate: false,
    showSwitch: false,
    isSwitchedOn: false,
  };

  handlePress = () => this.props.onPress(this.props.name);

  handleSwitch = (newValue: boolean) => {
    const { name, onSwitch } = this.props;
    if (onSwitch) {
      onSwitch(name, newValue);
    }
  };

  colors = () => {
    const { color, backgroundColor } = this.props;
    if (
      backgroundColor !== undefined
      && backgroundColor !== ''
      && color !== undefined
      && color !== ''
    ) {
      throw new Error('StreamItem received both `color` and `backgroundColor`');
    }
    if (backgroundColor !== undefined && backgroundColor !== '') {
      const foregroundColor = foregroundColorFromBackground(backgroundColor);
      return {
        backgroundColor,
        textColor: foregroundColor,
        iconColor: foregroundColor,
      };
    }
    if (color !== undefined && color !== '') {
      return {
        backgroundColor: undefined,
        textColor: this.context.color,
        iconColor: color,
      };
    }
    // TODO WORK HERE: I think this is impossible too.
    // Better yet: replace `color` and `backgroundColor` with one `streamColor`,
    // and a prop like `coloring: 'highlights' | 'background'` to control
    // where it's used.
    return {
      backgroundColor: undefined,
      textColor: this.context.color,
      iconColor: foregroundColorFromBackground(this.context.backgroundColor),
    };
  };

  render() {
    const {
      name,
      description,
      color,
      backgroundColor,
      isPrivate,
      isMuted,
      iconSize,
      showSwitch,
      isSwitchedOn,
      unreadCount,
    } = this.props;

    const wrapperStyle = [styles.listItem, { backgroundColor }, isMuted && componentStyles.muted];
    // TODO: confirm these '' cases are irrelevant, and remove.
    const iconColor =
      color !== undefined && color !== ''
        ? color
        : foregroundColorFromBackground(
            backgroundColor !== undefined && backgroundColor !== ''
              ? backgroundColor
              : this.context.backgroundColor,
          );
    const textColorStyle =
      backgroundColor !== undefined && backgroundColor !== ''
        ? { color: (foregroundColorFromBackground(backgroundColor): string) }
        : { color: this.context.color };

    return (
      <Touchable onPress={this.handlePress}>
        <View style={wrapperStyle}>
          <StreamIcon size={iconSize} color={iconColor} isMuted={isMuted} isPrivate={isPrivate} />
          <View style={componentStyles.text}>
            <RawLabel numberOfLines={1} style={textColorStyle} text={name} ellipsizeMode="tail" />
            {description !== undefined
              && description !== '' && (
                <RawLabel
                  numberOfLines={1}
                  style={componentStyles.description}
                  text={description}
                  ellipsizeMode="tail"
                />
              )}
          </View>
          <UnreadCount color={iconColor} count={unreadCount} />
          {showSwitch && (
            <ZulipSwitch
              defaultValue={!!isSwitchedOn}
              onValueChange={this.handleSwitch}
              disabled={!isSwitchedOn && isPrivate}
            />
          )}
        </View>
      </Touchable>
    );
  }
}
