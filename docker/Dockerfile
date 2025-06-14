FROM node:22-bookworm

RUN apt-get update && apt-get install -y \
  libgtkextra-dev \
  libgconf2-dev \
  libnss3 \
  libasound2 \
  libxtst-dev \
  libxss1 \
  libgtk-3-0 \
  libdrm2 \
  libgbm1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libasound2-dev \
  libpangocairo-1.0-0 \
  libatk1.0-0 \
  libcairo-gobject2 \
  libgtk-3-0 \
  libgdk-pixbuf2.0-0 \
  libcanberra-gtk* \
  libx11-xcb1 \
  libxkbcommon0 \
  xauth \
  xvfb \
  unzip \
  git \
  dbus-x11 \
  mesa-utils \
  libegl1-mesa \
  libgl1-mesa-glx \
  sudo \
  fonts-noto-cjk \
  fonts-noto-cjk-extra \
  fontconfig \
  && rm -rf /var/lib/apt/lists/*

# フォントキャッシュを更新
RUN fc-cache -fv

# Grant sudo privileges to the node user
RUN echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

WORKDIR /app

ENV NPM_CONFIG_LOGLEVEL=info

CMD [ "bash" ]
