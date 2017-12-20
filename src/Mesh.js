const tempPoint = new Tiny.Point();
const tempPolygon = new Tiny.Polygon();

/**
 * Base mesh class
 * @class
 * @extends Tiny.Container
 * @memberof Tiny.mesh
 */
class Mesh extends Tiny.Container {
  /**
   * @param {Tiny.Texture}  texture     - The texture to use
   * @param {Float32Array}  [vertices]  - if you want to specify the vertices
   * @param {Float32Array}  [uvs]       - if you want to specify the uvs
   * @param {Uint16Array}   [indices]   - if you want to specify the indices
   * @param {number}        [drawMode]  - the drawMode, can be any of the Mesh.DRAW_MODES consts
   */
  constructor(texture, vertices, uvs, indices, drawMode) {
    super();

    /**
     * The texture of the Mesh
     *
     * @member {Tiny.Texture}  Tiny.mesh.Mesh#_texture
     * @private
     */
    this._texture = texture;

    /**
     * An array of vertices
     *
     * @member {Float32Array} Tiny.mesh.Mesh#vertices
     */
    this.vertices = vertices ||
      new Float32Array([
        0, 0,
        100, 0,
        100, 100,
        0, 100,
      ]);

    /**
     * The Uvs of the Mesh
     *
     * @member {Float32Array} Tiny.mesh.Mesh#uvs
     */
    this.uvs = uvs ||
      new Float32Array([
        0, 0,
        1, 0,
        1, 1,
        0, 1,
      ]);

    /**
     * An array containing the indices of the vertices
     *
     * @member {Uint16Array}  Tiny.mesh.Mesh#indices
     */
    this.indices = indices || new Uint16Array([0, 1, 3, 2]);

    /**
     * The way the Mesh should be drawn, can be any of the {@link Tiny.mesh.Mesh.DRAW_MODES} consts
     *
     * @member {number} Tiny.mesh.Mesh#drawMode
     * @see Tiny.mesh.Mesh.DRAW_MODES
     */
    this.drawMode = drawMode || Mesh.DRAW_MODES.TRIANGLE_MESH;

    /**
     * Version of mesh uvs are dirty or not
     *
     * @member {number}  Tiny.mesh.Mesh#dirty
     */
    this.dirty = 0;

    /**
     * Version of mesh indices
     *
     * @member {number} Tiny.mesh.Mesh#indexDirty
     */
    this.indexDirty = 0;

    /**
     * The blend mode to be applied to the sprite. Set to `Tiny.BLEND_MODES.NORMAL` to remove
     * any blend mode.
     *
     * @member {number} Tiny.mesh.Mesh#blendMode
     * @default Tiny.BLEND_MODES.NORMAL
     * @see Tiny.BLEND_MODES
     */
    this.blendMode = Tiny.BLEND_MODES.NORMAL;

    /**
     * Triangles in canvas mode are automatically antialiased, use this value to force triangles
     * to overlap a bit with each other.
     *
     * @member {number} Tiny.mesh.Mesh#canvasPadding
     * @default 0
     */
    this.canvasPadding = Mesh.defaults.canvasPadding;

    /**
     * The default shader that is used if a mesh doesn't have a more specific one.
     *
     * @member {Tiny.Shader}  Tiny.mesh.Mesh#shader
     */
    this.shader = null;

    /**
     * The tint applied to the mesh. This is a [r,g,b] value. A value of [1,1,1] will remove any
     * tint effect.
     *
     * @member {number} Tiny.mesh.Mesh#tintRgb
     */
    this.tintRgb = new Float32Array([1, 1, 1]);

    /**
     * A map of renderer IDs to webgl render data
     *
     * @member {object<number, object>} Tiny.mesh.Mesh#_glDatas
     * @private
     */
    this._glDatas = {};

    /**
     * transform that is applied to UV to get the texture coords
     * its updated independently from texture uvTransform
     * updates of uvs are tied to that thing
     *
     * @member {Tiny.TextureTransform}  Tiny.mesh.Mesh#_uvTransform
     * @private
     */
    this._uvTransform = new Tiny.TextureTransform(texture);

    /**
     * whether or not upload uvTransform to shader
     * if its false, then uvs should be pre-multiplied
     * if you change it for generated mesh, please call 'refresh(true)'
     *
     * @member {boolean}  Tiny.mesh.Mesh#uploadUvTransform
     * @default false
     */
    this.uploadUvTransform = false;

    /**
     * Plugin that is responsible for rendering this element.
     * Allows to customize the rendering process without overriding '_renderWebGL' & '_renderCanvas' methods.
     *
     * @member {string} Tiny.mesh.Mesh#pluginName
     * @default 'mesh'
     */
    this.pluginName = 'mesh';
  }

  /**
   * Renders the object using the WebGL renderer
   *
   * @private
   * @param {Tiny.WebGLRenderer} renderer - a reference to the WebGL renderer
   */
  _renderWebGL(renderer) {
    this.refresh();
    renderer.setObjectRenderer(renderer.plugins[this.pluginName]);
    renderer.plugins[this.pluginName].render(this);
  }

  /**
   * Renders the object using the Canvas renderer
   *
   * @private
   * @param {Tiny.CanvasRenderer} renderer - The canvas renderer.
   */
  _renderCanvas(renderer) {
    this.refresh();
    renderer.plugins[this.pluginName].render(this);
  }

  /**
   * When the texture is updated, this event will fire to update the scale and frame
   *
   * @private
   */
  _onTextureUpdate() {
    this._uvTransform.texture = this._texture;
    this.refresh();
  }

  /**
   * multiplies uvs only if uploadUvTransform is false, call it after you change uvs manually, make sure that texture is valid
   */
  multiplyUvs() {
    if (!this.uploadUvTransform) {
      this._uvTransform.multiplyUvs(this.uvs);
    }
  }

  /**
   * Refreshes uvs for generated meshes (rope, plane), sometimes refreshes vertices too
   *
   * @param {boolean} [forceUpdate=false] if true, matrices will be updated any case
   */
  refresh(forceUpdate) {
    if (this._uvTransform.update(forceUpdate)) {
      this._refresh();
    }
  }

  /**
   * re-calculates mesh coords
   * @protected
   */
  _refresh() {
    /* empty */
  }

  /**
   * Returns the bounds of the mesh as a rectangle. The bounds calculation takes the worldTransform into account.
   *
   */
  _calculateBounds() {
    // TODO - we can cache local bounds and use them if they are dirty (like graphics)
    this._bounds.addVertices(this.transform, this.vertices, 0, this.vertices.length);
  }

  /**
   * Tests if a point is inside this mesh. Works only for TRIANGLE_MESH
   *
   * @param {Tiny.Point} point - the point to test
   * @return {boolean} the result of the test
   */
  containsPoint(point) {
    if (!this.getBounds().contains(point.x, point.y)) {
      return false;
    }

    this.worldTransform.applyInverse(point, tempPoint);

    const vertices = this.vertices;
    const points = tempPolygon.points;
    const indices = this.indices;
    const len = this.indices.length;
    const step = this.drawMode === Mesh.DRAW_MODES.TRIANGLES ? 3 : 1;

    for (let i = 0; i + 2 < len; i += step) {
      const ind0 = indices[i] * 2;
      const ind1 = indices[i + 1] * 2;
      const ind2 = indices[i + 2] * 2;

      points[0] = vertices[ind0];
      points[1] = vertices[ind0 + 1];
      points[2] = vertices[ind1];
      points[3] = vertices[ind1 + 1];
      points[4] = vertices[ind2];
      points[5] = vertices[ind2 + 1];

      if (tempPolygon.contains(tempPoint.x, tempPoint.y)) {
        return true;
      }
    }

    return false;
  }

  /**
   * The texture that the mesh uses.
   *
   * @member {Tiny.Texture}
   */
  get texture() {
    return this._texture;
  }

  set texture(value) {
    if (this._texture === value) {
      return;
    }

    this._texture = value;

    if (value) {
      // wait for the texture to load
      if (value.baseTexture.hasLoaded) {
        this._onTextureUpdate();
      } else {
        value.once('update', this._onTextureUpdate, this);
      }
    }
  }

  /**
   * The tint applied to the mesh. This is a hex value. A value of 0xFFFFFF will remove any tint effect.
   *
   * @member {number}
   * @default 0xFFFFFF
   */
  get tint() {
    return Tiny.rgb2hex(this.tintRgb);
  }

  set tint(value) {
    this.tintRgb = Tiny.hex2rgb(value, this.tintRgb);
  }
}

/**
 * Different drawing buffer modes supported
 *
 * @static
 * @constant
 * @type {object}
 * @property {number} TRIANGLE_MESH
 * @property {number} TRIANGLES
 */
Mesh.DRAW_MODES = {
  TRIANGLE_MESH: 0,
  TRIANGLES: 1,
};

/**
 * Mesh defaults values
 *
 * @static
 * @constant
 * @type {object}
 * @property {number} canvasPadding
 * @property {number} TRIANGLES
 */
Mesh.defaults = {
  canvasPadding: 0,
};

export default Mesh;
