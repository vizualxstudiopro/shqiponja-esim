# -*- coding: utf-8 -*-
path = r'd:\Shqiponja eSIM\frontend\app\bli\[id]\order-form.tsx'

with open(path, encoding='utf-8') as f:
    c = f.read()

import re
patterns = ['Ndrysho', 'Tani', 'procesohet', 'Kart', 'Politik', 'Privat',
            'detyru', 'inicializ', 'Gabim', 'paaktiv', 'ngarkuar', 'Provo']

for pat in patterns:
    for m in re.finditer(r'.{0,60}' + pat + r'.{0,60}', c):
        print(m.group().strip())
