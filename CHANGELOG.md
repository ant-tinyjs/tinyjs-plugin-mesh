## 1.3.0

`2020-05-25`

### Added
- `NineSlicePlane` 的 Canvas 渲染模式可以使用 tint
- 增加对 TinyX 2.0 的适配

## 1.2.0

`2019-12-24`

- TinyX 环境更改全局挂载对象为 $global，不再使用 my

## 1.1.0

`2019-07-15`

- 构建产物修改，并增加 AppXCanvasPlus 模式

## 1.0.0

`2018-12-03`

- 此版本需要基于 TinyJS v1.2.0
- 构建方式从 webpack@1.* 换成 rollup

### Added
- 增加 `Mesh` 的默认纹理为 `Texture.EMPTY`
- Canavs 渲染模式下的 `NineSlicePlane` 支持 `blendModes`

### Fixed
- 修复了 `Plane` 和 `NineSlicePlane` 的 `dirty` 问题
- 修复了 Canavs 渲染模式下 `NineSlicePlane` 的分辨率问题和 `Mesh` 的 `alpha` 问题和渲染问题
- 修复了 `Plane` 纹理频繁替换的问题
- 修复了 `Mesh` 的 VAO 内存泄漏问题
- 修复了 `NineSlicePlane` 的 resize 问题

## 0.0.4

`2017-12-21`

- 为了解决 Mesh 类在三角纹理拼接时边缘羽化导致的空隙，增加 Canvas 渲染模式下执行绘制的次数

## 0.0.3

`2017-12-20`

- 增加 `Mesh.defaults` 配置
- 修改 `scale = -1` 的时候计算错误导致间隙异常的问题

## 0.0.2

`2017-12-12`

