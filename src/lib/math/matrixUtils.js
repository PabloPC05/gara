/**
 * Utilidades matemáticas para transformaciones 3D en Mol*.
 */
import { Mat4 } from 'molstar/lib/mol-math/linear-algebra.js';

/** 
 * Crea una matriz de rotación sobre el eje Y. 
 * @param {number} a Ángulo en radianes.
 */
export function rotMatY(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return Mat4.ofRows([
    [c, 0, s, 0],
    [0, 1, 0, 0],
    [-s, 0, c, 0],
    [0, 0, 0, 1]
  ]);
}

/** 
 * Crea una matriz de rotación sobre el eje X. 
 * @param {number} a Ángulo en radianes.
 */
export function rotMatX(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return Mat4.ofRows([
    [1, 0, 0, 0],
    [0, c, -s, 0],
    [0, s, c, 0],
    [0, 0, 0, 1]
  ]);
}

/**
 * Aplica una rotación Yaw+Pitch alrededor de un centroide.
 * @param {Mat4} mat Matriz a modificar (in-place).
 * @param {import('molstar/lib/mol-math/linear-algebra.js').Vec3} centroid Centro de rotación.
 * @param {number} yaw Ángulo en radianes (Y).
 * @param {number} pitch Ángulo en radianes (X).
 */
export function applyRotation(mat, centroid, yaw, pitch) {
  const [tx, ty, tz] = [centroid[0], centroid[1], centroid[2]];
  const T = Mat4.ofRows([[1, 0, 0, tx], [0, 1, 0, ty], [0, 0, 1, tz], [0, 0, 0, 1]]);
  const Ti = Mat4.ofRows([[1, 0, 0, -tx], [0, 1, 0, -ty], [0, 0, 1, -tz], [0, 0, 0, 1]]);
  const R = Mat4.mul(Mat4(), rotMatX(pitch), rotMatY(yaw));
  const delta = Mat4.mul(Mat4(), T, Mat4.mul(Mat4(), R, Ti));
  Mat4.mul(mat, delta, mat);
}

/**
 * Aplica una traslación alineada con los ejes de la cámara.
 * @param {Mat4} mat Matriz a modificar (in-place).
 * @param {import('molstar/lib/mol-math/linear-algebra.js').Vec3} right Vector 'derecha' de la cámara.
 * @param {import('molstar/lib/mol-math/linear-algebra.js').Vec3} up Vector 'arriba' de la cámara.
 * @param {number} dx Desplazamiento X en píxeles.
 * @param {number} dy Desplazamiento Y en píxeles.
 * @param {number} scale Factor de escala para convertir píxeles a unidades de mundo.
 */
export function applyTranslation(mat, right, up, dx, dy, scale) {
  const wx = (right[0] * dx - up[0] * dy) * scale;
  const wy = (right[1] * dx - up[1] * dy) * scale;
  const wz = (right[2] * dx - up[2] * dy) * scale;
  const T = Mat4.ofRows([[1, 0, 0, wx], [0, 1, 0, wy], [0, 0, 1, wz], [0, 0, 0, 1]]);
  Mat4.mul(mat, T, mat);
}
