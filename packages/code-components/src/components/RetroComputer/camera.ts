export type Vector3Tuple = [number, number, number];

export interface RetroComputerCamera {
  position: Vector3Tuple;
  target: Vector3Tuple;
  fov: number;
}

export const DEFAULT_CAMERA: RetroComputerCamera = {
  position: [-14.31, 6.19, 29.78],
  target: [3.49, 4.37, 2.01],
  fov: 30,
};
