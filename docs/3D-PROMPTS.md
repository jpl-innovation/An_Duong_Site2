# ADDC: lời nhắc 3D cho raea

Website đã có sẵn mô hình 3D dựng bằng code. Việc của raea là **nâng chúng thành vật thể trông như thật**, giữ nguyên kích thước, vị trí và bố cục để thay vào web không bị lệch.

Mỗi mô hình có hai tệp đưa vào raea (cập nhật 20/11/2026, 26 mô hình):

- `models/source/<tên>.glb`: mô hình gốc (hình khối, tỉ lệ, vị trí).
- `models/reference/<tên>.png`: ảnh chụp mô hình gốc trên website.

Cách làm cho mỗi mô hình: đưa vào raea tệp `.glb` và ảnh `.png`, dán **Lời nhắc chung (mục 1)**, rồi dán **lời nhắc riêng** của mô hình đó. Lời nhắc viết bằng tiếng Anh vì công cụ 3D hiểu tiếng Anh tốt nhất.

---

## 1. Lời nhắc chung (dán trước mọi lời nhắc riêng)

```
You are enhancing an existing 3D model for the website of ADDC (An Duong Design + Construction), an architecture, construction and interior company in Ho Chi Minh City, Vietnam. The website is premium, calm and architectural: warm off-white stone, deep charcoal, a burnt-orange accent, real photographs of Vietnamese building sites. The 3D models must look like photographs of real objects, not like toys or game assets.

Keep EXACTLY: the silhouette, proportions, part layout, position, orientation and real-world scale of the attached model. Only make it look real: real materials, real joints and thicknesses, real small details.

Output rules:
- Format: one .glb (glTF 2.0 binary), PBR metallic-roughness materials, all textures embedded.
- Units: metres, Y-up, origin at the centre of the base, the object resting on y = 0.
- Budget: under 60k triangles and under 6 MB per object (houses and rooms: under 250k triangles and 15 MB); textures 2048 px max, 1024 px for small parts.
- Materials: physically plausible roughness, subtle surface imperfections, slight edge wear, bevelled edges (2 to 5 mm) so light catches the corners; no glossy plastic, no cartoon colours, no stretched textures.
- No text, logos, watermarks, people, ground plane, sky, background or baked lighting in the textures.
- Keep each separate part a separate mesh (do not merge everything into one mesh).
```

---

## 2. Vật liệu (trang Thi công, mục "Vật liệu làm nên ngôi nhà")

| Tệp xuất ra | Lời nhắc riêng |
|---|---|
| `be-tong.glb` | `Cast-in-place reinforced concrete column stub, 40 x 40 x 120 cm, freshly stripped from plywood formwork: light grey Portland concrete with faint horizontal formwork seams, tiny air pores, slightly darker damp patches at the base, crisp but very slightly chipped edges. Four ribbed steel rebar starter bars (D20) protrude 50 cm from the top, dark mill-scale steel with light orange surface rust. A 15 cm concrete test cube sits beside it.` |
| `thep.glb` | `Bundle of seven ribbed deformed steel reinforcing bars (rebar, D20, 3 m long) lying horizontally on two rough timber chocks, tied with three loops of thin black annealed tie wire and three square stirrups. Steel is dark grey mill scale with patchy light orange rust, helical and longitudinal ribs clearly modelled. Rough sawn tropical hardwood chocks with dirt marks.` |
| `gach.glb` | `Short wall of Vietnamese fired clay hollow bricks ("gach ong", 8 x 8 x 18 cm, four square holes running lengthwise), running bond, 5 bricks wide and 6 courses high, 1 cm grey cement-sand mortar joints that squeeze out slightly. Bricks vary from orange-red to darker burnt red, rough fired surfaces, small chips; the four holes visible on the end bricks.` |
| `da.glb` | `Natural stone samples: a polished white marble slab 190 x 110 x 2 cm with soft grey and faint gold veining and a clearcoat sheen, on a low walnut plinth; behind it a polished black-and-grey speckled granite slab leaning at about 60 degrees. Clean sawn edges with a small chamfer.` |
| `gach-op.glb` | `Floor tiling sample: three 60 x 60 cm matte porcelain tiles in warm beige-grey with subtle stone speckle on a 5 cm grey mortar bed, 3 mm grey grout lines and a few white plastic tile spacers; a fourth tile lifted and tilted on one corner, showing its unglazed ribbed back.` |
| `kinh.glb` | `Aluminium window, 150 x 200 cm, two panels with a centre mullion, slim system profile in dark grey satin powder coat, 10 mm clear tempered glass with a faint green edge tint, real transparency and reflection, rubber gaskets at the glass edge. A small light grey concrete block stands behind the window so the glass reads as transparent.` |
| `go.glb` | `Interior timber samples stacked loosely: a solid oak plank (2.3 m x 34 cm x 3 cm) with straight grain and satin oil finish, a walnut plank of the same size with darker chocolate grain, an 18 mm moisture-resistant MDF board with a white matte laminate face and oak edge banding, and a 24 x 24 cm oak beam lying diagonally across the front. Visible end grain on cut ends.` |
| `terrazzo.glb` | `Two finish samples on the floor. 1) Terrazzo: a 180 x 110 x 3 cm slab lying flat and a 120 x 70 cm slab tilted up behind it; polished cast terrazzo with a warm off-white cement ground and irregular chips of white and grey marble, sage green, terracotta and small black stone, 2 to 12 mm, honed satin finish. 2) Vietnamese encaustic cement tiles ("gach bong"), 20 x 20 x 1.5 cm: four tiles laid in a square and one lifted at an angle; matte cement surface with a four-petal pattern in deep green, a terracotta centre dot and mustard-yellow quarter circles in the corners, slightly worn edges.` |

---

## 3. Đồ nội thất (trang Nội thất, mục "Từng món đóng theo kích thước")

Phong cách chung cho cả bộ: nội thất Việt Nam đương đại, gỗ sồi và óc chó, vải dệt, đồng thau, đơn giản và ấm. Làm như ảnh chụp catalogue đồ gỗ cao cấp.

| Tệp xuất ra | Lời nhắc riêng |
|---|---|
| `noi-that-sofa.glb` | `Three-seat sofa, 2.2 m wide, 95 cm deep, on four short tapered walnut legs. Upholstered in warm greige woven boucle-like fabric with visible weave and soft welt seams; two plump seat cushions, two back cushions leaning slightly back, rounded arms, one moss green velvet throw cushion. Fabric shows gentle creases where it would be sat on.` |
| `noi-that-ban-tra.glb` | `Round coffee table, 1.1 m diameter, 45 cm high: solid walnut top 4.5 cm thick with rounded edge and visible grain, on a turned walnut pedestal that flares to the floor, standing on a round polished white marble base. On the top: a small concrete vase and a closed linen-bound book.` |
| `noi-that-ban-an.glb` | `Dining set: solid oak dining table 180 x 90 cm, 4 cm top with soft edges, slim walnut legs; six dining chairs with oak frames, moss green fabric seat pads and a gently curved oak back rail; a small grey ceramic vase in the centre.` |
| `noi-that-ghe-an.glb` | `One dining chair: walnut legs and back posts, oak seat frame, moss green upholstered seat pad with piping, a curved oak back rail 3 cm thick, slight backward tilt. Real joinery visible where the rails meet the legs.` |
| `noi-that-tu-bep.glb` | `Fitted kitchen run: base cabinets 2.4 m long, 85 cm high, 60 cm deep, in matte warm-white lacquer with handle-less push doors and a thin dark shadow gap at the top; a 2 cm white quartz worktop with faint grey veining; a black glass induction hob; wall cabinets above in the same lacquer; a walnut kick plinth. Very fine door gaps (3 mm).` |
| `noi-that-giuong.glb` | `Double bed 1.8 x 2.0 m: low walnut platform frame with a tall upholstered headboard in warm greige fabric with vertical channel stitching, a white mattress with crisp cotton sheets, a folded oatmeal linen throw at the foot, two pillows; two small walnut bedside tables.` |
| `noi-that-tu-ao.glb` | `Floor-to-ceiling wardrobe 1.8 m wide, 2.2 m high, 60 cm deep: three oak-veneer doors with continuous vertical grain across the doors, slim vertical brushed brass handles, on a recessed walnut plinth. 3 mm door gaps, real veneer grain.` |
| `noi-that-ban-lam-viec.glb` | `Home office desk 1.4 x 0.7 m: oak top 3.5 cm thick on slim dark-grey powder-coated steel legs, a matte warm-white drawer pedestal with two brushed brass pulls, a closed aluminium laptop, a brass desk lamp with a cone shade on a thin arm; one oak dining-style chair tucked in.` |
| `noi-that-ke-sach.glb` | `Open bookshelf 1.2 m wide, 2 m high, 35 cm deep in oak with 2.5 cm thick shelves and a walnut back panel; styled with a few rows of real-looking books in muted colours, two ceramic vases and a small plant.` |

---

## 4. Ngôi nhà (trang Kiến trúc và trang chủ)

| Tệp xuất ra | Lời nhắc riêng |
|---|---|
| `house.glb` | `Modern three-storey Vietnamese townhouse (nha pho), 7.2 m wide x 10 m deep, 3.3 m floor-to-floor; keep the exact massing of the attached model. Reinforced concrete frame with smooth off-white painted render over brick; flat roof with a 0.95 m parapet, a stair tower at the back left with a slightly sloped concrete lid, a dark aluminium pergola over the front of the roof terrace. Front: ground floor walnut-veneer entrance door and full-height glass shopfront; upper floors full-width clear glazing set back behind frameless glass balcony balustrades with thin aluminium top rails; a vertical oak timber screen on the right edge. Small front yard with grass, a low rendered fence wall, a dark aluminium gate and three tropical trees (frangipani or areca palm). Daytime look, warm interior lights subtly visible.` |

**Quan trọng cho ngôi nhà:** đặt tên vật liệu lớp sơn ngoài là `Render` để nút "Màu mặt tiền" trên trang Kiến trúc vẫn đổi được màu.

---

## 5. Bảy giai đoạn thi công (trang Thi công và đoạn "Cách ADDC làm một công trình" ở trang chủ)

**Quan trọng:** cả bảy tệp phải cùng gốc toạ độ, cùng tỉ lệ, cùng vị trí như tệp gốc, chỉ khác những gì đã được xây. Nếu lệch, ngôi nhà sẽ "nhảy" khi chuyển giai đoạn.

Dán lời nhắc chung, câu dưới đây (thay N), rồi mô tả giai đoạn:

```
This is stage N of a 7-stage construction sequence of the same townhouse (phase-0.glb is stage 1, phase-6.glb is stage 7). Keep every element that exists in the attached model exactly where it is; add nothing from later stages. It must look like a real Ho Chi Minh City building site at this stage, the way ADDC's own sites look: blue corrugated steel hoarding along the street with a white and blue "AN DUONG" site board on two steel posts, blue safety netting on steel tube scaffolding, a red hydraulic pile-pressing rig stacked with brown concrete counterweight blocks.
```

| Tệp | Mô tả giai đoạn |
|---|---|
| `phase-0.glb` | `Site preparation and piling: levelled brown compacted soil plot, precast square concrete pile heads sticking up 50 cm in pairs at each column position, faint chalk setting-out lines. A red steel pile-pressing rig with two tall guide columns stands in the middle, its two sides stacked with brown precast concrete counterweight blocks; a stack of grey spun concrete piles lies on the right. Blue corrugated steel hoarding and the site board along the front.` |
| `phase-1.glb` | `Foundations: concrete pad footings and ground beams just cast, grey and slightly damp, ground floor slab poured, a few leftover plywood formwork boards at the edges. Hoarding and site board still in place.` |
| `phase-2.glb` | `Reinforced concrete frame: three storeys of columns, beams and slabs in raw grey concrete with formwork marks, rebar starter bars sticking out of the top columns. The front facade is covered floor by floor by steel tube scaffolding with timber planks and translucent blue safety netting.` |
| `phase-3.glb` | `Brick infill: orange-red fired clay hollow brick walls with grey mortar joints between the columns on all floors, window and door openings left open. Scaffolding and blue netting still on the front.` |
| `phase-4.glb` | `Roof and waterproofing: roof parapet bricked, roof slab covered with dark grey bituminous waterproofing membrane, stair tower built, dark aluminium pergola frame installed. Scaffolding still on the front.` |
| `phase-5.glb` | `Finishes: scaffolding removed, all walls rendered and painted off-white, glass shopfront and upper glazing installed, glass balconies, walnut entrance door, vertical oak screen on the facade. Hoarding still on the street.` |
| `phase-6.glb` | `Handover: same as stage 6, hoarding removed, plus grass front yard, low rendered fence, dark aluminium gate, three trees, warm interior lights on at dusk.` |

---

## 6. Phòng nội thất (trang Nội thất, mục "Phối thử căn phòng của bạn")

Trên web, khách đổi được: không gian (phòng khách, phòng ngủ, góc làm việc), sàn (5 loại), màu tường (5 màu), ốp lam gỗ, màu gỗ, màu vải bọc, ánh sáng. Vì vậy mô hình phòng phải **đặt tên vật liệu đúng như dưới đây**, nếu không các nút sẽ không đổi được gì.

| Tệp xuất ra | Lời nhắc riêng |
|---|---|
| `room.glb` | `Cutaway living room, 6 x 5 m floor, 3 m ceiling height, only the back wall and the left wall (left wall has a 2 x 1.5 m aluminium-framed window with real glass). Keep the furniture layout of the attached model: a three-seat sofa in warm greige woven fabric with two seat cushions against the back wall, a round walnut coffee table on a pedestal base, a moss green velvet armchair with oak legs, a low walnut sideboard under the window, a brass cone pendant lamp on a thin black cord, a potted fiddle-leaf plant in a concrete pot, a cream wool rug, and a framed abstract artwork on the back wall. Contemporary Vietnamese interior, calm and warm, soft daylight from the window.` |

Dán thêm đoạn này ngay sau lời nhắc riêng của phòng:

```
IMPORTANT material names (the website swaps these at runtime):
- the floor: "Floor"
- both walls: "Wall"
- all oak parts: "Oak"; all walnut parts: "Walnut"
- sofa and armchair upholstery: "Fabric"
Use a neutral light colour for "Fabric" and "Wall" so tinting works.
```

---

## 7. Đưa mô hình mới vào website

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
5. Chưa nối GLB cho: hành trình 3D ở trang chủ, ba bộ đồ của phòng ngủ và góc làm việc trong trình phối phòng, nút màu mặt tiền và nút ẩn công trình tạm khi dùng GLB. Khi raea xuất xong, gửi lại các tệp để nối tiếp.
6. Muốn xuất lại mô hình gốc sau khi sửa code: mở `http://localhost:8080/tools/export-3d.html` và bấm "Tải tất cả mô hình".
