export type Vector3Tuple = [number, number, number];

export interface RetroComputerCamera {
  position: Vector3Tuple;
  target: Vector3Tuple;
  fov: number;
}

export const DEFAULT_CAMERA: RetroComputerCamera = {
  position: [-9.85, 6.02, 22.23],
  target: [3.21, 4.68, 1.81],
  fov: 30,
};
