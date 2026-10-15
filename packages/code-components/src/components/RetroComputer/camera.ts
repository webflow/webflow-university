export type Vector3Tuple = [number, number, number];

export interface RetroComputerCamera {
  position: Vector3Tuple;
  target: Vector3Tuple;
  fov: number;
}

export const DEFAULT_CAMERA: RetroComputerCamera = {
  position: [-5, 5, 26],
  target: [3.21, 4.68, 2],
  fov: 27,
};
