# ADDC: lời nhắc 3D cho raea (bản chân thực, 20/11/2026)

Website đang dùng mô hình 3D dựng bằng code: đúng hình khối, nhưng nhìn còn thô, như đồ chơi. Khách xem web là chủ nhà sắp bỏ tiền xây nhà; họ muốn thấy **vật thật**: bê tông có rỗ khí, thép có gân và gỉ, gỗ có thớ, vải có sợi, kính trong suốt. Việc của raea là biến 31 mô hình thành vật thể trông như ảnh chụp, **giữ nguyên kích thước, vị trí và bố cục** để thay vào web không bị lệch.

## 0. Cách làm cho mỗi mô hình

1. Đưa vào raea tệp gốc `models/source/<tên>.glb` và ảnh `models/reference/<tên>.png` (ảnh chụp mô hình gốc trên web, nếu có).
2. Đưa thêm **ảnh thật làm mẫu** ghi ở cột "Ảnh thật" (ảnh công trình của chính ADDC). raea sẽ bắt chước chất liệu và không khí của công trình thật.
3. Dán **Lời nhắc chung (mục 1)**, rồi **lời nhắc riêng** của mô hình đó. Với nhóm có lời nhắc nhóm (nội thất, giai đoạn thi công, chi tiết kết cấu), dán lời nhắc nhóm vào giữa.
4. Kiểm bản raea xuất ra theo **mục 9 (Duyệt hay làm lại)** trước khi gửi lại để nối vào web.

Lời nhắc viết bằng tiếng Anh vì công cụ 3D hiểu tiếng Anh tốt nhất.

---

## 1. Lời nhắc chung (dán trước mọi lời nhắc riêng)

```
ROLE
You are a senior archviz 3D artist. You are rebuilding an existing low-detail 3D model as a
photoreal, production-quality asset for the website of ADDC (An Duong Design + Construction),
an architecture, construction and interior company in Ho Chi Minh City, Vietnam.

WHO SEES IT
Homeowners in Vietnam about to spend their savings on building a house. They must feel they are
looking at a photograph of a real object on a real ADDC building site or in a real finished home,
never at a game asset, a toy, a clay render or a "3D model". If any part looks blocky, faceted,
plasticky, too clean or too uniform, the asset has failed.

KEEP EXACTLY (non-negotiable)
- Silhouette, proportions, part layout, position, orientation and real-world scale of the attached
  .glb. Overlay your result on the original: outer bounds must match within 1 cm.
- Units: metres. Y-up. Origin at the centre of the base footprint, object resting on y = 0.
- Every separate part stays a separate, sensibly named mesh (do not merge everything into one).

MAKE IT REAL: GEOMETRY
- No visible faceting anywhere. Curves get enough segments to look round at close range:
  at least 32 segments on pipes, legs, bars and rims, 64 on round tables and pendant shades.
  Smooth shading with correct hard edges (auto-smooth about 30 degrees).
- Every hard edge gets a real bevel or chamfer (1 to 3 mm on furniture and metal, 3 to 8 mm on
  concrete, stone and timber) so the edges catch light. No knife-sharp CG edges.
- Real thicknesses: glass has thickness (not a single plane), sheet metal 1 to 2 mm, door gaps
  2 to 4 mm, worktops and shelves at their real thickness.
- Real construction: visible joinery where rails meet legs, screw or pin heads where they would
  be, sewn seams and welts on upholstery, mortar joints set back 3 to 5 mm from the brick face,
  rebar ribs modelled, tie wire twisted at crossings.
- Natural irregularity: nothing perfectly repeated. Bricks, tiles, planks, bars and cushions each
  differ slightly in size, angle, colour and wear. Fabric has gentle creases and sag; cushions are
  plump, not boxes. Stacked items are not perfectly aligned.

MAKE IT REAL: MATERIALS (glTF 2.0 PBR metallic-roughness)
- Every material has: base colour, normal map and an occlusion-roughness-metallic map (ORM).
  Roughness must VARY across the surface (wear, dust, polish, damp). A flat single roughness
  value is not acceptable.
- Base colour holds no lighting: no baked shadows, no baked highlights, no baked sky.
  Keep albedo in the physically valid range (no pure black below #1A1A1A, no pure white above #F0F0F0).
- Use real-world texel density: about 1024 px per metre for furniture and materials,
  512 px per metre for whole buildings. No stretched or visibly tiling textures; break tiling with
  variation and decals (dust, stains, water marks, scuffs).
- Subtle realism layers: edge wear on corners, dust in crevices, slight colour shift between
  pieces, fingerprints-level micro detail on metal and glass (very subtle).
- Allowed glTF extensions (the website supports them): KHR_materials_transmission + KHR_materials_ior
  + KHR_materials_volume for glass and water, KHR_materials_clearcoat for lacquer, polished stone and
  car-paint-like finishes, KHR_materials_sheen for fabric, KHR_texture_transform.
  Leaves, netting and grass use alpha cut-out (alphaMode MASK), not alpha blend.
- Reference values (adjust within reason):
  raw concrete roughness 0.80 to 0.95, dark mill-scale steel metallic 1 roughness 0.55 to 0.75 with
  rust patches metallic 0 roughness 0.9, oiled oak roughness 0.45 to 0.6, matte lacquer roughness
  0.35 plus a thin clearcoat, polished marble roughness 0.05 to 0.12 plus clearcoat, brushed brass
  metallic 1 roughness 0.25 to 0.35, powder-coated aluminium roughness 0.45, glass transmission 1
  roughness 0.02 ior 1.52, woven fabric roughness 0.85 to 0.95 with sheen.

HOW THE WEBSITE SHOWS IT (so it holds up)
- Rendered live in Three.js r160 with ACES filmic tone mapping, a neutral studio environment map
  and one warm soft sun with soft shadows. Background is either deep moss green (#22392B) or warm
  stone (#EFEBE0). The site's accent is brushed brass (#B48A45).
- The visitor can orbit 360 degrees and zoom in close on a 2460 px wide screen, so the object must
  hold up from every side and at close range, including the underside a camera can see.

OUTPUT
- One .glb (glTF 2.0 binary), all textures embedded as JPEG (PNG only where alpha is needed).
- No Draco, no Meshopt, no KTX2 compression (the site's loader does not decode them).
- Budget per single object: under 80k triangles and 8 MB. Rooms, houses and construction stages:
  under 300k triangles and 20 MB. Textures 2048 px max; 1024 px for small parts.
- No text, logos, watermarks, people, ground plane, sky, backdrop, cameras or lights inside the file.
```

---

## 2. Vật liệu (trang Thi công, mục "Vật liệu làm nên ngôi nhà")

Mỗi mẫu đứng một mình trong khung xem, khách xoay và phóng to. Đây là nơi khách xem gần nhất, nên bề mặt phải thật nhất.

| Tệp xuất ra | Ảnh thật | Lời nhắc riêng |
|---|---|---|
| `be-tong.glb` | `img/fb/log/` (ảnh đổ bê tông) | `Cast-in-place reinforced concrete column stub, 40 x 40 x 120 cm, freshly stripped from plywood formwork. Light grey Portland concrete (#9C9A94 to #B4B1AA) with faint horizontal plywood seams every 30 cm and the imprint of plywood grain, scattered tiny air pores (bugholes, 1 to 4 mm) concentrated near the top, a slightly darker damp band 15 cm high at the base, a thin grey cement slurry run on one face, crisp 5 mm chamfered edges with two small chips. Four D20 ribbed steel starter bars protrude 50 cm from the top: dark blue-grey mill scale, patchy orange-brown surface rust, rust streaks staining the concrete top below each bar, helical and longitudinal ribs modelled in geometry. Beside it: a 15 cm concrete test cube with a hand-written-looking chalk mark (no readable text) and slightly rough sides.` |
| `thep.glb` | `img/fb/log/` (ảnh buộc thép) | `Bundle of seven D20 deformed steel reinforcing bars, 3 m long, lying horizontally on two rough-sawn tropical hardwood chocks. Bars not perfectly parallel, very slight sag between supports, cut ends showing bright shear faces with a burr. Steel: dark blue-grey mill scale with flaking patches, orange-brown rust stronger on the upper faces, ribs (crescent pattern plus two longitudinal ribs) in real geometry. Three ties of twisted black annealed wire with the twisted tails sticking out, three square stirrups (D8) hanging loosely. Chocks have soil marks, splits and rust drips from the bars.` |
| `gach.glb` | `img/fb/log/` (ảnh xây tường) | `Short wall of Vietnamese fired clay hollow bricks ("gach ong", 8 x 8 x 18 cm, four square holes running lengthwise), running bond, 5 bricks wide, 6 courses high. Every brick slightly different: orange-red #B5552F to burnt red #8E3B22, darker scorch marks, rough fired skin with small pits and chips, a few hairline cracks. 1 cm grey cement-sand mortar joints (#8F8B84), recessed 3 mm, squeezed out unevenly on the back face, gritty texture with sand grains. The four square holes are clearly visible and dark inside on the end bricks. A little mortar splatter on the bottom course.` |
| `da.glb` | `img/materials/da-marble.jpg` | `Natural stone samples. Front: polished white Carrara-type marble slab 190 x 110 x 2 cm, soft grey veins with faint warm gold, mirror-like clearcoat with soft reflections, 2 mm chamfer on the sawn edges showing the slightly translucent stone, standing on a low oiled walnut plinth. Behind, leaning at about 60 degrees: polished black-and-grey speckled granite slab with mica sparkle (subtle), same thickness, honed edge. A small felt pad under each slab corner.` |
| `gach-op.glb` | không | `Floor tiling sample: three 60 x 60 x 1 cm matte porcelain tiles in warm beige-grey (#C9C0B0) with subtle stone speckle and slight shade variation between tiles, laid on a 5 cm grey cement mortar bed whose edges are rough and crumbly, 3 mm grey grout lines slightly below the tile face, four white cross-shaped plastic tile spacers still in place. A fourth tile lifted and leaning on one corner, showing its unglazed ribbed back in pale clay with a printed-style grid pattern (no text) and mortar comb lines stuck to it.` |
| `kinh.glb` | `img/fb/` (ảnh mặt tiền kính các công trình) | `Aluminium window, 150 x 200 cm, two panes with a centre mullion. Slim system profile in dark grey satin powder coat (#3A3C3E) with real extruded profile shape, visible mitred corner joints and drainage slots on the bottom rail, black EPDM rubber gaskets at the glass edge. 10 mm clear tempered glass with physically correct transmission, slight green tint visible on the glass edges, crisp reflections. A small light grey concrete block stands 40 cm behind the window so the transparency reads. A tiny factory sticker area left blank (no text).` |
| `go.glb` | `img/materials/go.webp` | `Interior timber samples stacked loosely. A solid white oak plank 230 x 34 x 3 cm, straight grain with ray flecks, satin oil finish with soft sheen. A walnut plank of the same size, chocolate heartwood with lighter sapwood streak on one edge. An 18 mm moisture-resistant MDF board with green core visible on the cut edge, white matte laminate face and 1 mm oak edge banding. A 24 x 24 cm oak beam lying diagonally across the front, with visible end grain, growth rings and a small check (crack) on the end. Every cut end shows true end grain, not plank texture.` |
| `terrazzo.glb` | `img/materials/` | `Two finish samples on the floor. 1) Terrazzo: a 180 x 110 x 3 cm slab lying flat and a 120 x 70 cm slab tilted up behind it; polished cast terrazzo, warm off-white cement ground (#E8E2D4), irregular angular chips of white and grey marble, sage green, terracotta and small black stone, 2 to 12 mm, chip density natural and uneven, honed satin finish with soft reflections, chips visible in section on the cut edges. 2) Vietnamese encaustic cement tiles ("gach bong"), 20 x 20 x 1.5 cm: four tiles laid in a square, one lifted at an angle; matte cement face with a four-petal pattern in deep green (#2F4A39), a terracotta centre dot and mustard-yellow quarter circles in the corners, colours slightly soft and pigment-like, worn corners, grey cement body visible on the edges.` |

---

## 3. Đồ nội thất (trang Nội thất, mục "Từng món đóng theo kích thước")

Dán thêm **lời nhắc nhóm** này sau lời nhắc chung, trước lời nhắc riêng:

```
FURNITURE SET STYLE
Contemporary Vietnamese interior made by a skilled local workshop: solid oak and walnut, woven
fabrics, brushed brass, matte warm-white lacquer. Calm, warm, honest materials. It must look like a
photograph from a high-end furniture maker's catalogue: real joinery, real upholstery, real wood.
- Wood: real grain that follows each part's length, grain continuous around corners, end grain on
  cut ends, 1 to 2 mm rounded edges, satin oil finish, faint wear on edges people touch.
- Upholstery: fabric with visible weave in the normal map plus sheen, welt/piping along seams,
  stitching, soft rounded cushion edges, gentle creases and a slight sit-in dip. Never a box with a
  fabric texture.
- Brass: brushed, slightly warm, very subtle fingerprints. Lacquer: matte with a thin clearcoat.
- Styling objects (books, vases, lamps) must also be real: books with page blocks and covers,
  ceramics with glaze variation.
- Keep material names exactly: oak parts "Oak", walnut parts "Walnut", upholstery "Fabric"
  (neutral light colour, the website tints it).
```

| Tệp xuất ra | Lời nhắc riêng |
|---|---|
| `noi-that-sofa.glb` | `Three-seat sofa, 2.2 m wide, 95 cm deep, 80 cm high, on four short tapered solid walnut legs with brass glides. Upholstered in warm greige boucle-like woven fabric with a soft looped texture; two plump seat cushions with a slight sit-in dip, two back cushions leaning back with natural creases, rounded arms with a welt seam along the front edge. One moss green velvet throw cushion (#2F4A39) with a karate-chop dent, velvet sheen changing with angle.` |
| `noi-that-ban-tra.glb` | `Round coffee table, 1.1 m diameter, 45 cm high: solid walnut top 4.5 cm thick, rounded edge, real walnut grain across the top in glued-up boards with matched grain, on a turned walnut pedestal that flares to the floor, standing on a round polished white marble base with clearcoat. On top: a small hand-cast concrete vase with tiny air pores and a single dried branch, and a closed linen-bound book with visible page block.` |
| `noi-that-ban-an.glb` | `Dining set: solid oak dining table 180 x 90 cm, 4 cm top with softly eased edges and visible board joints, slim tapered walnut legs joined by mortise-and-tenon to an apron; six dining chairs (see the single chair) with oak frames, moss green fabric seat pads with piping and a curved oak back rail, chairs pulled out at slightly different angles. A small grey stoneware vase with reactive glaze in the centre.` |
| `noi-that-ghe-an.glb` | `One dining chair: walnut legs and back posts with a slight taper, oak seat frame, moss green upholstered seat pad with piping and gentle crowning, a curved oak back rail 3 cm thick with continuous bent-lamination grain, slight backward tilt of the back. Visible joinery where rails meet legs, small corner blocks under the seat, felt pads under the feet.` |
| `noi-that-tu-bep.glb` | `Fitted kitchen run: base cabinets 2.4 m long, 85 cm high, 60 cm deep, matte warm-white lacquer (#ECE8DF) with handle-less push doors, 3 mm door gaps and a 2 cm dark shadow gap under the worktop; 2 cm white quartz worktop with faint grey veining, polished with soft reflections, eased edge; a black glass induction hob with faint printed zone circles (no text) and a slight smudge; an undermount stainless sink with a brushed steel tap; wall cabinets above in the same lacquer; a recessed walnut kick plinth. A wooden chopping board and a ceramic jar on the worktop.` |
| `noi-that-giuong.glb` | `Double bed 1.8 x 2.0 m: low walnut platform frame, tall upholstered headboard in warm greige fabric with vertical channel stitching and soft puffed channels, a white mattress with crisp cotton sheets showing natural wrinkles, a folded oatmeal linen throw at the foot with soft drape over the edge, two pillows and two smaller cushions, slightly dented. Two small walnut bedside tables with a drawer, one with a ceramic lamp with a linen shade.` |
| `noi-that-tu-ao.glb` | `Floor-to-ceiling wardrobe 1.8 m wide, 2.2 m high, 60 cm deep: three oak-veneer doors with book-matched grain running continuously across the three doors, slim vertical brushed brass bar handles on standoffs, 3 mm door gaps, a recessed walnut plinth with a shadow line. Veneer edges with 1 mm edge banding visible on close look.` |
| `noi-that-ban-lam-viec.glb` | `Home office desk 1.4 x 0.7 m: oak top 3.5 cm thick on slim dark-grey powder-coated steel legs with welded joints and levelling feet, a matte warm-white drawer pedestal with two brushed brass pulls, a closed aluminium laptop with rounded edges, a brass desk lamp with a cone shade on a thin articulated arm with a visible hinge and cable, a ceramic mug, one oak chair tucked in.` |
| `noi-that-ke-sach.glb` | `Open bookshelf 1.2 m wide, 2 m high, 35 cm deep in oak, 2.5 cm shelves with very slight sag under the books, walnut back panel. Styled like a real home: rows of books in muted colours with different heights and thicknesses, some leaning, one small horizontal stack, page blocks visible; two stoneware vases, a small trailing pothos plant in a terracotta pot with real leaf cards.` |

---

## 4. Ngôi nhà (trang Kiến trúc và trang chủ)

| Tệp xuất ra | Ảnh thật | Lời nhắc riêng |
|---|---|---|
| `house.glb` | `img/fb/nhapho2022/`, `img/fb/q3-4t/` | `Modern three-storey Vietnamese townhouse (nha pho), 7.2 m wide x 10 m deep, 3.3 m floor-to-floor; keep the exact massing of the attached model. Reinforced concrete frame with smooth off-white painted render over brick (#EDE9E0), the render showing very subtle trowel waves, slight rain staining under sills and at the parapet top, and faint dirt at the ground line. Flat roof with a 0.95 m parapet and a metal coping, a stair tower at the back left with a slightly sloped concrete lid, a dark aluminium pergola over the front of the roof terrace with real profile sections. Front: ground floor walnut-veneer entrance door with a brass pull and a full-height glass shopfront in slim dark frames; upper floors full-width clear glazing set back behind frameless glass balcony balustrades with thin aluminium top rails and stainless spigots; a vertical oak timber screen on the right edge, battens 4 x 8 cm with 4 cm gaps. The glass shows reflections and, behind it, a simple furnished interior (curtains, a sofa, ceiling lights) so it never looks empty or black. Small front yard: real grass with variation, a low rendered fence wall with a coping, a dark aluminium sliding gate, three tropical trees (frangipani or areca palm) with real leaf cards and bark. Rain gutters and downpipes, AC condenser units on a side wall, a house-number plate (no text). Daytime, warm interior lights subtly on.` |

**Quan trọng cho ngôi nhà:** đặt tên vật liệu lớp sơn ngoài là `Render` để nút "Màu mặt tiền" trên trang Kiến trúc vẫn đổi được màu. Cảnh "bản vẽ" trên trang Kiến trúc vẽ nét theo cạnh của mô hình, nên các mảng lớn (tường, sàn, kính) nên là mặt phẳng gọn, không nhăn.

---

## 5. Bảy giai đoạn thi công (trang Thi công)

**Quan trọng:** cả bảy tệp phải cùng gốc toạ độ, cùng tỉ lệ, cùng vị trí như tệp gốc, chỉ khác những gì đã được xây. Nếu lệch, ngôi nhà sẽ "nhảy" khi chuyển giai đoạn. Làm `phase-6.glb` trước (nhà hoàn thiện), rồi bóc dần ngược về `phase-0.glb`, để các chi tiết trùng khớp tuyệt đối.

Ảnh thật cho cả bảy giai đoạn: `img/equipment/ep-coc.jpg` (máy ép cọc), `img/equipment/gian-giao.jpg` (giàn giáo, lưới xanh), `img/equipment/chong-tang.jpg` (cây chống), `img/equipment/cu-vay.jpg`, `img/equipment/xe-cuoc.jpg`, và nhật ký công trường `img/fb/log/01.jpg` đến `10.jpg`.

Dán lời nhắc nhóm này (thay N) sau lời nhắc chung:

```
CONSTRUCTION SEQUENCE
This is stage N of a 7-stage construction sequence of the same townhouse (phase-0.glb is stage 1,
phase-6.glb is stage 7). Keep every element that exists in the attached model exactly where it is;
add nothing from later stages. It must look like a photograph of a real Ho Chi Minh City building
site at this stage, the way ADDC's own sites look in the attached photos:
- blue corrugated steel hoarding along the street, slightly dented and dusty, with a white and blue
  site board on two steel posts (leave the board blank, no text);
- blue safety netting on galvanised steel tube scaffolding with timber or steel planks, netting
  sagging slightly and tied at intervals (alpha cut-out mesh texture);
- a red hydraulic pile-pressing rig stacked with brown precast concrete counterweight blocks;
- site life without people: a few bags of cement, a sand pile, a stack of hollow bricks, a wheelbarrow,
  rebar offcuts, a water hose, puddles and mud on the ground, footprints and tyre marks.
Raw concrete looks freshly cast (darker, damp) on the newest elements and dry and lighter on older ones.
Name every temporary-works mesh (hoarding, scaffolding, netting, props, rig, site clutter) with the
prefix "Temp_" so the website's "hide temporary works" switch can hide them.
```

| Tệp | Mô tả giai đoạn |
|---|---|
| `phase-0.glb` | `Site preparation and piling: levelled brown compacted soil plot with tyre ruts and puddles, precast square concrete pile heads sticking up 50 cm in pairs at each column position, faint white chalk setting-out lines and timber pegs with string lines. A red steel pile-pressing rig with two tall guide columns stands in the middle, worn red paint with chips and oil stains, its two sides stacked with brown precast concrete counterweight blocks with lifting hooks. A stack of grey square precast piles on timber sleepers on the right. Blue corrugated hoarding and the site board along the front.` |
| `phase-1.glb` | `Foundations: concrete pile caps and ground beams just cast, grey and slightly damp, rebar starter bars for the columns sticking up with orange rust, ground floor slab poured with trowel marks and curing water puddles, a few leftover plywood formwork boards with concrete splatter at the edges, a cement mixer near the gate. Hoarding and site board still in place.` |
| `phase-2.glb` | `Reinforced concrete frame: three storeys of columns, beams and slabs in raw grey concrete with plywood formwork marks and slight colour variation between pours, rebar starter bars sticking out of the top columns, steel props still under the top slab. The front facade covered floor by floor by galvanised tube scaffolding with planks and translucent blue safety netting.` |
| `phase-3.glb` | `Brick infill: orange-red fired clay hollow brick walls with grey mortar joints between the columns on all floors, window and door openings left open with concrete lintels above them, mortar smears, brick stacks and cement bags on each floor slab. Scaffolding and blue netting still on the front.` |
| `phase-4.glb` | `Roof and waterproofing: roof parapet bricked, roof slab covered with dark grey bituminous waterproofing membrane with overlapping torch-on seams turned up the parapet, stair tower built, dark aluminium pergola frame installed. Walls on the lower floors partly rendered (grey cement render, not painted yet). Scaffolding still on the front.` |
| `phase-5.glb` | `Finishes: scaffolding removed, all walls rendered and painted off-white, glass shopfront and upper glazing installed with protective film still on some panes, glass balconies, walnut entrance door, vertical oak screen on the facade. Paint buckets and a ladder by the door. Hoarding still on the street.` |
| `phase-6.glb` | `Handover: same as the finished house.glb, hoarding and all site clutter removed, clean pavement, grass front yard, low rendered fence, dark aluminium gate, three trees, warm interior lights on at dusk.` |

---

## 6. Phòng nội thất (trang Nội thất, mục "Phối thử căn phòng của bạn")

Trên web, khách đổi được: không gian (phòng khách, phòng ngủ, góc làm việc), sàn (5 loại), màu tường (5 màu), ốp lam gỗ, màu gỗ, màu vải bọc, ánh sáng ngày/chiều/tối. Vì vậy mô hình phòng phải **đặt tên vật liệu đúng như dưới đây**, nếu không các nút sẽ không đổi được gì.

| Tệp xuất ra | Lời nhắc riêng |
|---|---|
| `room.glb` | `Cutaway living room, 6 x 5 m floor, 3 m ceiling height, only the back wall and the left wall. The left wall has a 2 x 1.5 m window with a slim dark aluminium frame, real glass and a sheer linen curtain gathered to one side. Walls: smooth painted plaster with very subtle roller texture, a 10 cm painted skirting board, a light switch plate. Keep the furniture layout of the attached model: a three-seat sofa in warm greige woven fabric with two seat cushions against the back wall, a round walnut coffee table on a pedestal base with a book and a small vase, a moss green velvet armchair with oak legs, a low walnut sideboard under the window with two ceramics, a brass cone pendant lamp on a thin black fabric cord with a visible warm bulb, a fiddle-leaf fig in a concrete pot with real leaf cards and soil, a cream wool rug with real pile and slight edge curl, and a framed abstract artwork (soft painterly shapes, no text) in a thin oak frame on the back wall. Contemporary Vietnamese interior, calm and warm, lived-in but tidy.` |

Dán thêm đoạn này ngay sau lời nhắc riêng của phòng:

```
IMPORTANT material names (the website swaps these at runtime):
- the floor: "Floor"
- both walls: "Wall"
- all oak parts: "Oak"; all walnut parts: "Walnut"
- sofa and armchair upholstery: "Fabric"
Use a neutral light colour for "Fabric" and "Wall" so tinting works, and keep their detail in the
normal and roughness maps, not in the base colour.
```

---

## 7. Chi tiết kết cấu (trang Thi công, mục chi tiết: móng cọc, lồng thép cột, dầm sàn, tường xây, chống thấm)

Năm mô hình này mới có tệp gốc (`models/source/chi-tiet-*.glb`, chưa có ảnh `.png`). Trên web, chúng **dựng lên từng bước**: mỗi bộ phận trong tệp gốc có tên `step<N>_<số>` (N là bước). Bản raea **phải giữ đúng tên và đúng chia bước** này, nếu không web không dựng từng bước được.

Ảnh thật: `img/fb/log/01.jpg` đến `10.jpg`, `img/equipment/chong-tang.jpg`.

Dán lời nhắc nhóm này sau lời nhắc chung:

```
STEP-BY-STEP CONSTRUCTION DETAIL
This is a cut-out construction detail that the website assembles step by step. Every mesh in the
attached file is named step<N>_<index>. Keep EXACTLY the same meshes with the same names and the
same step numbers; you may add detail inside a mesh (ribs, tie wire, texture) but do not merge
meshes across different steps, do not rename them, and do not add new parts without the right
step<N>_ prefix. The last-step concrete in the original is semi-transparent so the steel inside
shows; make that final concrete a real concrete material and name its material "ConcreteFinal"
(the website will fade it). Real site quality: rebar with ribs, rust and twisted tie wire at
crossings, concrete spacer blocks, plywood formwork with nail heads and concrete splatter.
```

| Tệp xuất ra | Lời nhắc riêng |
|---|---|
| `chi-tiet-coc-mong.glb` | `Pile cap detail on a 3 x 3 m patch of compacted brown soil: four square precast concrete piles cut off with exposed rebar ends (step 0), a 5 cm lean concrete blinding layer with a rough float finish (step 1), a two-way bottom rebar mesh on concrete spacer blocks, tied at every crossing (step 2), column starter bars with stirrups, tied to the mesh (step 3), the cast pile cap in fresh grey concrete (step 4).` |
| `chi-tiet-cot.glb` | `Column reinforcement detail on a slab patch: eight vertical ribbed bars (step 0), square stirrups closer together at top and bottom, hooked ends visible (step 1), small concrete cover spacer blocks clipped on (step 2), plywood formwork panels with timber battens and two steel push-pull props with base plates (step 3), the cast column in fresh concrete with formwork marks (step 4).` |
| `chi-tiet-dam-san.glb` | `Beam and slab detail: steel props with U-heads and timber bearers under plywood decking (step 0), beam cage with main bars and stirrups (step 1), bottom slab mesh (step 2), "chair" spacer bars and the top slab mesh (step 3), the poured beam and slab in fresh concrete with a power-floated top (step 4).` |
| `chi-tiet-tuong.glb` | `Brick wall detail between two concrete columns: the columns (step 0), short steel ties sticking out of the columns every 50 cm (step 1), the first courses of orange-red hollow brick in running bond with grey mortar (step 2), a concrete tie beam across the wall (step 3), further courses with a window opening left (step 4), a concrete lintel over the opening and the top courses (step 5).` |
| `chi-tiet-chong-tham.glb` | `Bathroom or roof floor waterproofing detail: concrete slab with a short plastered wall (step 0), a sloped cement screed falling to a floor drain (step 1), a grey-green cementitious waterproofing membrane brushed on and turned 30 cm up the wall, with brush marks and a reinforcing fleece strip at the corner (step 2), a thin layer of ponded water for the 24-hour leak test, real transparent water with a slight ripple (step 3), a protective cement screed (step 4), finished floor tiles laid one by one with grout (step 5).` |

---

## 8. Đưa mô hình mới vào website

1. Lưu các tệp raea xuất ra vào thư mục `models/` (ví dụ `models/be-tong.glb`, `models/noi-that-sofa.glb`, `models/phase-0.glb`).
2. Mở `js/scene3d.js`, điền đường dẫn vào khối `MODELS` ở đầu tệp:

```js
export const MODELS = {
  'be-tong': 'models/be-tong.glb', thep: 'models/thep.glb', gach: 'models/gach.glb', da: 'models/da.glb',
  go: 'models/go.glb', 'gach-op': 'models/gach-op.glb', kinh: 'models/kinh.glb', terrazzo: 'models/terrazzo.glb',
  sofa: 'models/noi-that-sofa.glb', 'ban-tra': 'models/noi-that-ban-tra.glb', 'ban-an': 'models/noi-that-ban-an.glb',
  'ghe-an': 'models/noi-that-ghe-an.glb', 'tu-bep': 'models/noi-that-tu-bep.glb', giuong: 'models/noi-that-giuong.glb',
  'tu-ao': 'models/noi-that-tu-ao.glb', 'ban-lam-viec': 'models/noi-that-ban-lam-viec.glb', 'ke-sach': 'models/noi-that-ke-sach.glb',
  house: 'models/house.glb',
  room: 'models/room.glb',
  phases: ['models/phase-0.glb', 'models/phase-1.glb', 'models/phase-2.glb', 'models/phase-3.glb',
           'models/phase-4.glb', 'models/phase-5.glb', 'models/phase-6.glb']
};
```

3. Mô hình nào để trống `''` thì website vẫn dùng bản dựng sẵn. Nếu tệp GLB lỗi, website tự quay về bản dựng sẵn, không vỡ trang.
4. Bảy tệp giai đoạn chỉ được dùng khi có đủ cả bảy.
5. Chưa nối GLB cho: năm chi tiết kết cấu, hành trình 3D ở trang chủ, bộ đồ phòng ngủ và góc làm việc trong trình phối phòng, nút màu mặt tiền và nút ẩn công trình tạm khi dùng GLB. Khi raea xuất xong, gửi lại các tệp để nối tiếp (tên `Temp_`, `step<N>_`, `Render`, `Floor`, `Wall`, `Oak`, `Walnut`, `Fabric` ở trên là để nối được).
6. Muốn xuất lại mô hình gốc sau khi sửa code: mở `tools/export-3d.html` (trên máy: `http://localhost:8080/tools/export-3d.html`; trên mạng: `https://jpl-innovation.github.io/An_Duong_Site2/tools/export-3d.html`) và bấm "Tải tất cả mô hình".

---

## 9. Duyệt hay làm lại

Mở tệp raea xuất ra trong một trình xem GLB (ví dụ gltf-viewer.donmccurdy.com), xoay một vòng, phóng to sát. **Làm lại** nếu gặp bất kỳ điều nào dưới đây; khi yêu cầu raea sửa, dán đúng dòng lỗi bằng tiếng Anh.

| Lỗi thấy được | Dán cho raea |
|---|---|
| Thấy cạnh gãy khúc trên chân bàn, ống, mép tròn | `Curved parts are faceted. Increase segments (min 32, 64 on large round parts) and use smooth shading.` |
| Góc sắc như dao, không bắt sáng | `Edges are razor sharp. Add real 1-8 mm bevels on every hard edge.` |
| Bề mặt bóng đều như nhựa | `Surfaces look like plastic. Add a varying roughness map with wear, dust and polish variation.` |
| Mọi viên gạch, thanh thép, tấm ván giống hệt nhau | `Repeated parts are identical. Vary size, angle, colour and wear per piece.` |
| Vải trông như hộp phủ vân | `Upholstery reads as boxes. Add rounded cushion volume, seams, piping, creases and fabric sheen.` |
| Kính đen hoặc đục | `Glass is opaque. Use KHR_materials_transmission, ior 1.52, roughness 0.02, real thickness.` |
| Cây, lá là khối tròn | `Foliage is blobs. Use real leaf cards with alpha MASK and bark on trunks.` |
| Ảnh màu có bóng đổ vẽ sẵn | `Base colour contains baked lighting. Remove it; keep shading only in AO.` |
| Kích thước hoặc vị trí lệch so với tệp gốc | `Bounds do not match the source .glb. Match position, scale and origin within 1 cm.` |
| Tệp quá nặng (vượt ngân sách ở mục 1) | `File is over budget. Reduce triangles on hidden parts and textures to 1024 px on small parts.` |
| Thiếu tên `Render`, `Floor`, `Wall`, `Oak`, `Walnut`, `Fabric`, `Temp_`, `step<N>_` | `Material and mesh names are missing. Use exactly the names listed in the prompt.` |
