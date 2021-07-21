/* @flow strict-local */
import React, { useRef, useCallback, useLayoutEffect } from 'react';
import type { Node as React$Node } from 'react';
import { Animated, Easing } from 'react-native';

import type { Style } from '../types';

type Props = $ReadOnly<{|
  stylePropertyName: string,
  fullValue: number,
  children: React$Node,
  style?: Style,
  visible?: boolean,
  useNativeDriver?: boolean,
  delay?: number,
|}>;

export default function AnimatedComponent(props: Props) {
  const {
    visible = true,
    useNativeDriver = true,
    delay = 0,
    fullValue,
    children,
    stylePropertyName,
    style,
  } = props;

  const animatedValue = useRef(new Animated.Value(0));

  const animate = useCallback(() => {
    Animated.timing(animatedValue.current, {
      toValue: visible ? fullValue : 0,
      delay,
      duration: 300,
      useNativeDriver,
      easing: Easing.out(Easing.poly(4)),
    }).start();
  }, [delay, fullValue, useNativeDriver, visible]);

  useLayoutEffect(() => {
    animate();
  });

  const animatedStyle = {
    [stylePropertyName]: animatedValue.current,
  };

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}
