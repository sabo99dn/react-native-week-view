import { StyleSheet } from 'react-native';

const circleSize = 8;
const lineWidth = 1.5;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 2,
    borderTopWidth: lineWidth,
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    borderRadius: 5,
    color: 'white',
    padding: 2
  },
  text:{
    color: 'white',
    fontWeight: '700'
  }
});

export default styles;
