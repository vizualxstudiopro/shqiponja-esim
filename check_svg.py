import re, base64, zlib, struct

def get_first_pixel(png_data):
    # Find IDAT chunk and try to get first pixel
    # Simple approach: find PNG signature, then IHDR, then IDAT
    if png_data[:4] != b'\x89PNG':
        return None
    # Read IHDR
    w = struct.unpack('>I', png_data[16:20])[0]
    h = struct.unpack('>I', png_data[20:24])[0]
    bit_depth = png_data[24]
    color_type = png_data[25]
    
    # Collect IDAT data
    idat = b''
    i = 8
    while i < len(png_data):
        length = struct.unpack('>I', png_data[i:i+4])[0]
        chunk_type = png_data[i+4:i+8]
        if chunk_type == b'IDAT':
            idat += png_data[i+8:i+8+length]
        i += 12 + length
        if chunk_type == b'IEND':
            break
    
    try:
        raw = zlib.decompress(idat)
        # First row starts after filter byte
        filter_byte = raw[0]
        # First pixel: bytes 1,2,3 for RGB or 1,2,3,4 for RGBA
        r, g, b = raw[1], raw[2], raw[3]
        return (r, g, b), (w, h), color_type
    except:
        return None

for v in ['1', '2']:
    p = fr'D:\Shqiponja eSIM\frontend\public\Logo\shqiponja esim Navbar web logo\{v}.svg'
    t = open(p, encoding='utf-8').read()
    m = re.search(r'xlink:href="data:image/png;base64,([^"]+)"', t)
    if m:
        data = base64.b64decode(m.group(1))
        result = get_first_pixel(data)
        if result:
            pixel, dims, ct = result
            print(f'SVG{v}: dims={dims}, color_type={ct}, first_pixel=RGB{pixel}')
            brightness = sum(pixel) / 3
            print(f'  -> {"LIGHT" if brightness > 128 else "DARK"} background')
        else:
            print(f'SVG{v}: could not decode pixel')
    else:
        print(f'SVG{v}: no embedded png')
