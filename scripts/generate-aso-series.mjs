import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const draftsDir = path.resolve(__dirname, "../prisma/data/blog-drafts");

function textNode(text) {
  return { type: "text", text };
}

function paragraph(text) {
  return {
    type: "paragraph",
    content: [textNode(text)],
  };
}

function heading(level, text) {
  return {
    type: "heading",
    attrs: { level },
    content: [textNode(text)],
  };
}

function bulletList(items) {
  return {
    type: "bulletList",
    content: items.map((item) => ({
      type: "listItem",
      content: [paragraph(item)],
    })),
  };
}

function orderedList(items) {
  return {
    type: "orderedList",
    content: items.map((item) => ({
      type: "listItem",
      content: [paragraph(item)],
    })),
  };
}

function blockquote(text) {
  return {
    type: "blockquote",
    content: [paragraph(text)],
  };
}

function codeBlock(language, text) {
  return {
    type: "codeBlock",
    attrs: { language },
    content: [textNode(text)],
  };
}

function imageBlock(src, alt = "", title = "") {
  return {
    type: "image",
    attrs: {
      src,
      alt: alt || "Captura de pantalla del laboratorio",
      title: title || alt || "Laboratorio ASO",
    },
  };
}

function buildDoc(blocks) {
  const content = blocks.map((b) => {
    switch (b.type) {
      case "heading":
        return heading(b.level, b.text);
      case "paragraph":
        return paragraph(b.text);
      case "bulletList":
        return bulletList(b.items);
      case "orderedList":
        return orderedList(b.items);
      case "blockquote":
        return blockquote(b.text);
      case "code":
        return codeBlock(b.language, b.text);
      case "image":
        return imageBlock(b.src, b.alt, b.title);
      default:
        return paragraph("");
    }
  });
  return { type: "doc", content };
}

const SERIES_NAME =
  "Arquitectura de Sistemas Operativos: Kernel, Personalización y Servicios";
const ARCHIVE_DATE = "2020-11-23T00:00:00.000Z";
const CLARIFICATION_NOTE =
  "Nota histórica y de archivo: Este artículo forma parte de una serie de laboratorio desarrollada originalmente el 23 de noviembre de 2020 para la asignatura de Arquitectura de Sistemas Operativos en la Universidad Nacional de Ingeniería (UNI), Managua. Se preserva con fines didácticos e históricos, integrando notas técnicas actualizadas sobre estándares modernos de Linux y redes.";

const posts = [
  {
    slug: "aso-01-ubuntu-mate-entorno",
    seriesOrder: 1,
    title: "Ubuntu MATE como Entorno de Ingeniería de Sistemas Operativos",
    excerpt:
      "Reseña histórica de Ubuntu MATE, entorno de escritorio MATE vs GNOME 3, eficiencia de recursos y configuración inicial para desarrollo y administración de sistemas.",
    tags: [
      "linux",
      "ubuntu-mate",
      "sistemas-operativos",
      "universidad",
      "archivo-2020",
    ],
    coverImage: "/images/blog/aso/image37.png",
    blocks: [
      { type: "blockquote", text: CLARIFICATION_NOTE },
      {
        type: "heading",
        level: 2,
        text: "Introducción y Reseña de Ubuntu MATE",
      },
      {
        type: "paragraph",
        text: "Ubuntu MATE es una distribución de software libre y código abierto, estable y accesible, diseñada con un entorno de escritorio configurable. Es ideal para estaciones de trabajo de desarrollo que buscan maximizar el rendimiento del hardware conservando una metáfora de escritorio tradicional y predecible.",
      },
      {
        type: "paragraph",
        text: "La distribución nació de la mano de Martin Wimpress y Alan Pope a partir de Ubuntu 14.10, convirtiéndose formalmente en sabor oficial de Canonical en febrero de 2015. Esto le permitió integrarse plenamente en la infraestructura de compilación, empaquetado y control de calidad de Canonical Ltd.",
      },
      {
        type: "heading",
        level: 2,
        text: "Arquitectura de Escritorio: MATE vs. GNOME 3",
      },
      {
        type: "paragraph",
        text: "La principal diferenciación técnica de Ubuntu MATE radica en su entorno de escritorio. Mientras que el sabor principal de Ubuntu adoptó GNOME 3 (con su gestor Mutter y un consumo de memoria más intensivo), MATE preserva la arquitectura modular de GNOME 2 pero adaptada a bibliotecas modernas GTK3.",
      },
      {
        type: "bulletList",
        items: [
          "Bajo consumo de memoria RAM: huella inicial inferior a 600 MB en reposo.",
          "Menor latencia de renderizado de interfaz, liberando ciclos de CPU para tareas pesadas como compilación de código fuente.",
          "Compatibilidad superior tanto en hardware moderno como en máquinas legadas o entornos virtuales.",
          "Control granular de paneles, applets y componentes de interfaz.",
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "Personalización de Entorno con MATE Tweak",
      },
      {
        type: "paragraph",
        text: "A través de la utilidad MATE Tweak, el usuario puede alternar entre distintas metáforas de interfaz gráfica con un solo clic: 'Traditional' (dos paneles clásicos al estilo GNOME 2), 'Redmond' (panel inferior con menú de inicio tipo Windows), 'Cupertino' (barra superior y dock al estilo macOS) o 'Mutiny' (panel lateral al estilo Unity).",
      },
      {
        type: "heading",
        level: 2,
        text: "Preparación del Sistema para Laboratorios de Bajo Nivel",
      },
      {
        type: "paragraph",
        text: "Antes de emprender labores de compilación del kernel y configuración de servicios de red, es indispensable actualizar la base de datos de paquetes y verificar la integridad de los repositorios del sistema.",
      },
      {
        type: "code",
        language: "bash",
        text: "sudo apt update && sudo apt upgrade -y\nsudo apt install -y build-essential curl wget git net-tools",
      },
    ],
  },
  {
    slug: "aso-02-modificar-compilar-kernel-linux",
    seriesOrder: 2,
    title: "Modificación en C y Compilación del Kernel Linux desde las Fuentes",
    excerpt:
      "Guía paso a paso para descargar el árbol del kernel Linux, configurar .config, modificar init/main.c con printk a nivel de alerta y compilar paquetes Debian con make deb-pkg.",
    tags: [
      "linux",
      "kernel",
      "lenguaje-c",
      "compilacion",
      "sistemas-operativos",
      "archivo-2020",
    ],
    coverImage: "/images/blog/aso/image26.png",
    blocks: [
      { type: "blockquote", text: CLARIFICATION_NOTE },
      {
        type: "heading",
        level: 2,
        text: "¿Por qué modificar y compilar el Kernel?",
      },
      {
        type: "paragraph",
        text: "El núcleo (kernel) de Linux gestiona el acceso al hardware, la asignación de memoria, la planificación de procesos y las llamadas al sistema. Aunque las distribuciones proveen núcleos precompilados, compilar desde las fuentes permite habilitar características experimentales, depurar subsistemas, optimizar para arquitecturas específicas y comprender el flujo de arranque en el anillo de ejecución más privilegiado (Ring 0).",
      },
      {
        type: "heading",
        level: 2,
        text: "1. Instalación de Herramientas de Compilación",
      },
      {
        type: "paragraph",
        text: "Antes de instalar, actualizamos la caché del repositorio de paquetes APT:",
      },
      { type: "code", language: "bash", text: "sudo apt-get update" },
      {
        type: "image",
        src: "/images/blog/aso/image1.png",
        alt: "Actualización de caché APT",
      },
      {
        type: "paragraph",
        text: "Instalamos las herramientas base: compilador gcc, utilidades de sincronización y calculadora de línea de comandos:",
      },
      {
        type: "code",
        language: "bash",
        text: "sudo apt-get install gcc rsync bc",
      },
      {
        type: "image",
        src: "/images/blog/aso/image2.png",
        alt: "Instalación de gcc rsync bc",
      },
      {
        type: "paragraph",
        text: "Instalamos bibliotecas para interfaces TUI basadas en texto y metapaquete build-essential:",
      },
      {
        type: "code",
        language: "bash",
        text: "sudo apt-get install libncurses5-dev build-essential",
      },
      {
        type: "image",
        src: "/images/blog/aso/image3.png",
        alt: "Instalación de libncurses5-dev y build-essential",
      },
      {
        type: "paragraph",
        text: "Instalamos generadores léxicos/sintácticos y cabeceras criptográficas:",
      },
      {
        type: "code",
        language: "bash",
        text: "sudo apt-get install bison flex libssl-dev libelf-dev",
      },
      {
        type: "image",
        src: "/images/blog/aso/image4.png",
        alt: "Instalación de bison flex libssl-dev libelf-dev",
      },
      {
        type: "paragraph",
        text: "Opcionalmente instalamos un editor gráfico o empleamos nano/vim en consola:",
      },
      { type: "code", language: "bash", text: "sudo apt-get install gedit" },
      {
        type: "image",
        src: "/images/blog/aso/image5.png",
        alt: "Instalación de editor de texto",
      },
      {
        type: "heading",
        level: 2,
        text: "2. Ajuste Preliminar del Gestor de Arranque (GRUB)",
      },
      {
        type: "paragraph",
        text: "Para asegurar que los mensajes de inicio sean visibles, abrimos '/etc/default/grub':",
      },
      { type: "code", language: "bash", text: "sudo gedit /etc/default/grub" },
      {
        type: "image",
        src: "/images/blog/aso/image6.png",
        alt: "Apertura del archivo grub",
      },
      {
        type: "paragraph",
        text: "Comentamos '#GRUB_TIMEOUT_STYLE=hidden', fijamos 'GRUB_TIMEOUT=10' y aseguramos 'GRUB_CMDLINE_LINUX_DEFAULT=\"splash\"':",
      },
      {
        type: "image",
        src: "/images/blog/aso/image7.png",
        alt: "Configuración editada de GRUB",
      },
      {
        type: "paragraph",
        text: "Actualizamos los cambios en el cargador:",
      },
      { type: "code", language: "bash", text: "sudo update-grub" },
      {
        type: "image",
        src: "/images/blog/aso/image8.png",
        alt: "Actualización de GRUB con update-grub",
      },
      {
        type: "heading",
        level: 2,
        text: "3. Descarga y Descompresión del Kernel",
      },
      {
        type: "paragraph",
        text: "Ingresamos a kernel.org para obtener el enlace al tarball del código fuente:",
      },
      {
        type: "image",
        src: "/images/blog/aso/image9.png",
        alt: "Página oficial kernel.org",
      },
      {
        type: "paragraph",
        text: "Nos situamos en la carpeta Descargas y procedemos a la descarga mediante wget:",
      },
      { type: "code", language: "bash", text: "cd Descargas" },
      {
        type: "image",
        src: "/images/blog/aso/image10.png",
        alt: "Directorio de descargas",
      },
      {
        type: "code",
        language: "bash",
        text: "wget https://cdn.kernel.org/pub/linux/kernel/v5.x/linux-5.9.8.tar.xz",
      },
      {
        type: "image",
        src: "/images/blog/aso/image11.png",
        alt: "Descarga del tarball del kernel",
      },
      {
        type: "heading",
        level: 2,
        text: "4. Configuración del Kernel (.config)",
      },
      {
        type: "paragraph",
        text: "Verificamos la versión actual del kernel con 'uname -r':",
      },
      { type: "code", language: "bash", text: "uname -r" },
      {
        type: "image",
        src: "/images/blog/aso/image12.png",
        alt: "Versión de kernel inicial",
      },
      {
        type: "paragraph",
        text: "Descomprimimos el tarball y entramos al directorio de fuentes:",
      },
      {
        type: "code",
        language: "bash",
        text: "tar -xvf linux-5.9.8.tar.xz\ncd linux-5.9.8/",
      },
      {
        type: "image",
        src: "/images/blog/aso/image13.png",
        alt: "Descompresión del kernel",
      },
      {
        type: "image",
        src: "/images/blog/aso/image14.png",
        alt: "Ingreso al directorio de fuentes",
      },
      {
        type: "paragraph",
        text: "Inspeccionamos el tamaño del árbol fuente con 'du -sh':",
      },
      { type: "code", language: "bash", text: "du -sh" },
      {
        type: "image",
        src: "/images/blog/aso/image15.png",
        alt: "Espacio en disco del kernel descomprimido",
      },
      {
        type: "paragraph",
        text: "Copiamos el archivo de configuración del kernel en ejecución al nuevo árbol:",
      },
      {
        type: "code",
        language: "bash",
        text: "cp -v /boot/config-$(uname -r) ./.config",
      },
      {
        type: "image",
        src: "/images/blog/aso/image16.png",
        alt: "Copia de .config",
      },
      {
        type: "paragraph",
        text: "Como alternativa, podemos afinar la configuración según el hardware conectado mediante 'make localmodconfig':",
      },
      { type: "code", language: "bash", text: "make localmodconfig" },
      {
        type: "image",
        src: "/images/blog/aso/image17.png",
        alt: "Configuración asistida con localmodconfig",
      },
      {
        type: "heading",
        level: 2,
        text: "5. Modificación del Kernel en init/main.c",
      },
      {
        type: "paragraph",
        text: "Accedemos al directorio init e ingresamos al archivo de arranque 'main.c':",
      },
      { type: "code", language: "bash", text: "cd init/\ngedit main.c" },
      {
        type: "image",
        src: "/images/blog/aso/image18.png",
        alt: "Acceso al directorio init",
      },
      {
        type: "image",
        src: "/images/blog/aso/image19.png",
        alt: "Apertura de main.c",
      },
      {
        type: "paragraph",
        text: "Localizamos la función 'numa_default_policy()' e insertamos nuestro mensaje con printk y un retardo de observación:",
      },
      {
        type: "code",
        language: "c",
        text: '/* Debajo de numa_default_policy() */\nprintk(KERN_ALERT "=======================================\\n");\nprintk(KERN_ALERT "[UNI-ASO] Kernel Linux Modificado!\\n");\nprintk(KERN_ALERT "Jesus Hernandez & Juan Lopez\\n");\nprintk(KERN_ALERT "=======================================\\n");\nmdelay(10000);',
      },
      {
        type: "image",
        src: "/images/blog/aso/image20.png",
        alt: "Edición de main.c con printk y mdelay",
      },
      {
        type: "paragraph",
        text: "Guardamos los cambios y regresamos a la raíz del kernel:",
      },
      { type: "code", language: "bash", text: "cd .." },
      {
        type: "image",
        src: "/images/blog/aso/image21.png",
        alt: "Retorno a la carpeta raíz del kernel",
      },
      {
        type: "heading",
        level: 2,
        text: "6. Compilación e Instalación de Paquetes",
      },
      {
        type: "paragraph",
        text: "Iniciamos la compilación con empaquetado nativo para Debian/Ubuntu. Se recomienda usar '-j$(nproc)' para habilitar paralelismo multihilo:",
      },
      { type: "code", language: "bash", text: "make -j$(nproc) bindeb-pkg" },
      {
        type: "image",
        src: "/images/blog/aso/image22.png",
        alt: "Compilación del kernel con make deb-pkg",
      },
      {
        type: "paragraph",
        text: "Una vez concluida, nos desplazamos al directorio superior e instalamos los paquetes .deb generados:",
      },
      {
        type: "code",
        language: "bash",
        text: "cd ..\nsudo dpkg -i linux-*.deb",
      },
      {
        type: "image",
        src: "/images/blog/aso/image23.png",
        alt: "Directorio con paquetes deb compilados",
      },
      {
        type: "image",
        src: "/images/blog/aso/image24.png",
        alt: "Instalación de paquetes con dpkg",
      },
      {
        type: "heading",
        level: 2,
        text: "7. Comprobación y Verificación del Arranque",
      },
      {
        type: "paragraph",
        text: "Reiniciamos la computadora para iniciar con el nuevo núcleo:",
      },
      { type: "code", language: "bash", text: "sudo reboot" },
      {
        type: "image",
        src: "/images/blog/aso/image25.png",
        alt: "Reinicio del sistema",
      },
      {
        type: "paragraph",
        text: "Durante el arranque, se observa en pantalla el mensaje personalizado emitido por printk:",
      },
      {
        type: "image",
        src: "/images/blog/aso/image26.png",
        alt: "Mensaje de inicio personalizado en pantalla de arranque",
      },
      {
        type: "paragraph",
        text: "Finalmente, ejecutamos 'uname -r' para certificar que el sistema corre sobre la versión de kernel recién compilada:",
      },
      { type: "code", language: "bash", text: "uname -r" },
      {
        type: "image",
        src: "/images/blog/aso/image27.png",
        alt: "Verificación de versión de kernel actualizada",
      },
      {
        type: "image",
        src: "/images/blog/aso/image28.png",
        alt: "Confirmación en terminal",
      },
    ],
  },
  {
    slug: "aso-03-personalizar-grub-plymouth",
    seriesOrder: 3,
    title:
      "Personalización del Gestor de Arranque: GRUB 2 y Splash Screen Plymouth",
    excerpt:
      "Ajuste de resolución y fondo de pantalla en /etc/default/grub, regeneración del archivo de configuración con update-grub y sustitución de logotipos de inicio en initramfs.",
    tags: [
      "linux",
      "grub",
      "plymouth",
      "bootloader",
      "personalizacion",
      "archivo-2020",
    ],
    coverImage: "/images/blog/aso/image36.png",
    blocks: [
      { type: "blockquote", text: CLARIFICATION_NOTE },
      {
        type: "heading",
        level: 2,
        text: "1. Personalización de la Imagen del Menú GRUB",
      },
      {
        type: "paragraph",
        text: "El fondo del menú de GRUB admite formatos PNG, JPG (de 8 bits/256 colores) o TGA. Se recomienda formato PNG para evitar distorsiones de color. Abrimos el archivo de configuración:",
      },
      { type: "code", language: "bash", text: "sudo nano /etc/default/grub" },
      {
        type: "image",
        src: "/images/blog/aso/image29.png",
        alt: "Edición de /etc/default/grub",
      },
      {
        type: "paragraph",
        text: "Descomentamos GRUB_GFXMODE e ingresamos la resolución soportada por nuestro monitor (consultada con 'xrandr'):",
      },
      {
        type: "image",
        src: "/images/blog/aso/image30.png",
        alt: "Configuración de GRUB_GFXMODE",
      },
      {
        type: "paragraph",
        text: "Añadimos la directiva GRUB_BACKGROUND indicando la ruta absoluta de la imagen PNG:",
      },
      {
        type: "code",
        language: "bash",
        text: 'GRUB_BACKGROUND="/home/usuario/Imágenes/logo.png"',
      },
      {
        type: "image",
        src: "/images/blog/aso/image31.png",
        alt: "Directiva GRUB_BACKGROUND configurada",
      },
      {
        type: "paragraph",
        text: "Regeneramos la configuración activa con update-grub:",
      },
      { type: "code", language: "bash", text: "sudo update-grub" },
      {
        type: "image",
        src: "/images/blog/aso/image32.png",
        alt: "Regeneración de GRUB",
      },
      {
        type: "heading",
        level: 2,
        text: "2. Personalización del Logo de Arranque con Plymouth",
      },
      {
        type: "paragraph",
        text: "Accedemos al directorio donde se ubica nuestra nueva imagen PNG:",
      },
      {
        type: "image",
        src: "/images/blog/aso/image33.png",
        alt: "Ubicación de imagen de logo",
      },
      {
        type: "paragraph",
        text: "Reemplazamos las imágenes de los temas oficiales de Plymouth en el sistema:",
      },
      {
        type: "code",
        language: "bash",
        text: "sudo cp logos.png /usr/share/plymouth/ubuntu-logo.png\nsudo cp logos.png /usr/share/plymouth/themes/ubuntu-mate-logo/ubuntu-mate-logo.png\nsudo cp logos.png /usr/share/plymouth/themes/ubuntu-mate-logo/ubuntu-mate-logo16.png",
      },
      {
        type: "image",
        src: "/images/blog/aso/image34.png",
        alt: "Copia de logotipos en tema Plymouth",
      },
      {
        type: "paragraph",
        text: "Actualizamos el sistema de archivos en memoria (initramfs) para empacar la nueva imagen:",
      },
      { type: "code", language: "bash", text: "sudo update-initramfs -u" },
      {
        type: "image",
        src: "/images/blog/aso/image35.png",
        alt: "Actualización de initramfs",
      },
      {
        type: "heading",
        level: 2,
        text: "3. Comprobación Visual del Arranque",
      },
      {
        type: "paragraph",
        text: "Reiniciamos el sistema con 'sudo reboot'. Al encender, observamos el menú de GRUB con la imagen de fondo personalizada:",
      },
      {
        type: "image",
        src: "/images/blog/aso/image36.png",
        alt: "Menú GRUB personalizado",
      },
      {
        type: "paragraph",
        text: "Posteriormente, durante la transición de carga del sistema operativo, se aprecia el nuevo logo en Plymouth:",
      },
      {
        type: "image",
        src: "/images/blog/aso/image37.png",
        alt: "Logo de Plymouth en pantalla de arranque",
      },
    ],
  },
  {
    slug: "aso-04-servidor-archivos-vsftpd",
    seriesOrder: 4,
    title: "Despliegue y Seguridad de un Servidor de Archivos FTP con vsftpd",
    excerpt:
      "Instalación de vsftpd en Ubuntu, enjaulado chroot de usuarios, cortafuegos UFW, políticas de permisos seguras y comprobación desde clientes Windows y Android.",
    tags: ["linux", "ftp", "vsftpd", "redes", "seguridad", "archivo-2020"],
    coverImage: "/images/blog/aso/image61.png",
    blocks: [
      { type: "blockquote", text: CLARIFICATION_NOTE },
      {
        type: "heading",
        level: 2,
        text: "1. Instalación y Verificación de vsftpd",
      },
      {
        type: "paragraph",
        text: "Actualizamos los repositorios e instalamos el demonio vsftpd (Very Secure FTP Daemon):",
      },
      {
        type: "code",
        language: "bash",
        text: "sudo apt-get update\nsudo apt-get install vsftpd",
      },
      {
        type: "image",
        src: "/images/blog/aso/image38.png",
        alt: "Actualización de paquetes para vsftpd",
      },
      {
        type: "image",
        src: "/images/blog/aso/image39.png",
        alt: "Instalación de vsftpd",
      },
      {
        type: "paragraph",
        text: "Comprobamos el estado del servicio:",
      },
      { type: "code", language: "bash", text: "systemctl status vsftpd" },
      {
        type: "image",
        src: "/images/blog/aso/image40.png",
        alt: "Estado activo de vsftpd",
      },
      {
        type: "heading",
        level: 2,
        text: "2. Configuración del Cortafuegos (UFW)",
      },
      {
        type: "paragraph",
        text: "Verificamos si el firewall UFW se encuentra activo y habilitamos el tráfico en los puertos de control y datos:",
      },
      {
        type: "code",
        language: "bash",
        text: "sudo ufw status\nsudo ufw allow 20/tcp && sudo ufw allow 21/tcp",
      },
      {
        type: "image",
        src: "/images/blog/aso/image41.png",
        alt: "Estado de UFW",
      },
      {
        type: "image",
        src: "/images/blog/aso/image42.png",
        alt: "Reglas de firewall habilitadas",
      },
      {
        type: "heading",
        level: 2,
        text: "3. Creación de Usuario y Restricción de Acceso SSH",
      },
      {
        type: "paragraph",
        text: "Creamos un usuario dedicado para el servicio FTP:",
      },
      { type: "code", language: "bash", text: "sudo adduser USUARIO" },
      {
        type: "image",
        src: "/images/blog/aso/image43.png",
        alt: "Creación de usuario FTP con adduser",
      },
      {
        type: "paragraph",
        text: "Para mitigar vectores de ataque, restringimos a este usuario el acceso a terminal remota SSH agregando 'DenyUsers USUARIO' en '/etc/ssh/sshd_config':",
      },
      {
        type: "code",
        language: "bash",
        text: "sudo nano /etc/ssh/sshd_config",
      },
      {
        type: "image",
        src: "/images/blog/aso/image44.png",
        alt: "Edición de sshd_config",
      },
      {
        type: "image",
        src: "/images/blog/aso/image45.png",
        alt: "Directiva DenyUsers configurada",
      },
      {
        type: "paragraph",
        text: "Reiniciamos el servicio SSH:",
      },
      { type: "code", language: "bash", text: "sudo service sshd restart" },
      {
        type: "image",
        src: "/images/blog/aso/image46.png",
        alt: "Reinicio de sshd",
      },
      {
        type: "heading",
        level: 2,
        text: "4. Estructura de Directorios y Permisos Seguros",
      },
      {
        type: "paragraph",
        text: "Creamos la raíz de la jaula FTP del usuario:",
      },
      { type: "code", language: "bash", text: "sudo mkdir /home/USUARIO/ftp" },
      {
        type: "image",
        src: "/images/blog/aso/image47.png",
        alt: "Creación de directorio /home/USUARIO/ftp",
      },
      {
        type: "paragraph",
        text: "Asignamos la propiedad a nobody:nogroup y removemos permisos de escritura de la raíz de la jaula (requerido por vsftpd para prevenir escapes chroot):",
      },
      {
        type: "code",
        language: "bash",
        text: "sudo chown nobody:nogroup /home/USUARIO/ftp\nsudo chmod a-w /home/USUARIO/ftp",
      },
      {
        type: "image",
        src: "/images/blog/aso/image48.png",
        alt: "Chown nobody:nogroup",
      },
      {
        type: "image",
        src: "/images/blog/aso/image49.png",
        alt: "Chmod a-w en raíz de jaula",
      },
      {
        type: "paragraph",
        text: "Creamos el subdirectorio donde el usuario sí tendrá permisos de lectura y escritura:",
      },
      {
        type: "code",
        language: "bash",
        text: "sudo mkdir /home/USUARIO/ftp/archivos\nsudo chown USUARIO:USUARIO /home/USUARIO/ftp/archivos\nsudo chmod 755 /home/USUARIO/ftp/archivos",
      },
      {
        type: "image",
        src: "/images/blog/aso/image50.png",
        alt: "Creación de subdirectorio archivos",
      },
      {
        type: "image",
        src: "/images/blog/aso/image51.png",
        alt: "Permisos de usuario sobre subdirectorio",
      },
      { type: "heading", level: 2, text: "5. Configuración de vsftpd.conf" },
      {
        type: "paragraph",
        text: "Editamos '/etc/vsftpd.conf':",
      },
      { type: "code", language: "bash", text: "sudo nano /etc/vsftpd.conf" },
      {
        type: "image",
        src: "/images/blog/aso/image52.png",
        alt: "Edición de vsftpd.conf",
      },
      {
        type: "paragraph",
        text: "Habilitamos escritura con 'write_enable=YES':",
      },
      {
        type: "image",
        src: "/images/blog/aso/image53.png",
        alt: "write_enable=YES",
      },
      {
        type: "paragraph",
        text: "Enjaulamos usuarios locales con 'chroot_local_user=YES':",
      },
      {
        type: "image",
        src: "/images/blog/aso/image54.png",
        alt: "chroot_local_user=YES",
      },
      {
        type: "paragraph",
        text: "Definimos la raíz de navegación con 'user_sub_token=$USER' y 'local_root=/home/$USER/ftp':",
      },
      {
        type: "image",
        src: "/images/blog/aso/image55.png",
        alt: "user_sub_token y local_root",
      },
      {
        type: "paragraph",
        text: "Reiniciamos el servicio vsftpd:",
      },
      { type: "code", language: "bash", text: "systemctl restart vsftpd" },
      {
        type: "image",
        src: "/images/blog/aso/image56.png",
        alt: "Reinicio de vsftpd",
      },
      {
        type: "paragraph",
        text: "Creamos un archivo de prueba para validar la lectura:",
      },
      {
        type: "code",
        language: "bash",
        text: 'cd /home/USUARIO/ftp/archivos\necho "Esto es una prueba: Servidor FTP" > prueba.txt\nls -l',
      },
      {
        type: "image",
        src: "/images/blog/aso/image57.png",
        alt: "Archivo de prueba en subdirectorio",
      },
      {
        type: "paragraph",
        text: "Determinamos la dirección IP privada del servidor con net-tools / ifconfig:",
      },
      {
        type: "code",
        language: "bash",
        text: "sudo apt install net-tools\nifconfig",
      },
      {
        type: "image",
        src: "/images/blog/aso/image58.png",
        alt: "Instalación de net-tools",
      },
      {
        type: "image",
        src: "/images/blog/aso/image59.png",
        alt: "Comando ifconfig",
      },
      {
        type: "image",
        src: "/images/blog/aso/image60.png",
        alt: "IP privada del servidor",
      },
      {
        type: "heading",
        level: 2,
        text: "6. Comprobación Multiplataforma (Windows y Android)",
      },
      {
        type: "paragraph",
        text: "En Windows, conectamos mediante FileZilla Client ingresando IP, usuario, contraseña y puerto 21:",
      },
      {
        type: "image",
        src: "/images/blog/aso/image61.png",
        alt: "Conexión exitosa desde FileZilla en Windows",
      },
      {
        type: "paragraph",
        text: "En Android, abrimos Cx File Explorer, accedemos a Red > '+' > FTP e ingresamos los parámetros del servidor:",
      },
      {
        type: "image",
        src: "/images/blog/aso/image62.png",
        alt: "Cx File Explorer en Android - Selección de red",
      },
      {
        type: "image",
        src: "/images/blog/aso/image63.png",
        alt: "Configuración de conexión FTP en Android",
      },
      {
        type: "image",
        src: "/images/blog/aso/image64.png",
        alt: "Autenticación del cliente Android",
      },
      {
        type: "image",
        src: "/images/blog/aso/image65.png",
        alt: "Navegación de archivos remotos en Android",
      },
    ],
  },
  {
    slug: "aso-05-servidor-voip-asterisk-pbx",
    seriesOrder: 5,
    title: "Telefonía IP y Servidor VoIP con Asterisk PBX en Linux",
    excerpt:
      "Configuración de una centralita telefónica con Asterisk, creación de usuarios y extensiones SIP, definición del dialplan en extensions.conf y llamadas de prueba con softphones.",
    tags: ["linux", "voip", "asterisk", "sip", "telefonia-ip", "archivo-2020"],
    coverImage: "/images/blog/aso/image72.png",
    blocks: [
      { type: "blockquote", text: CLARIFICATION_NOTE },
      {
        type: "heading",
        level: 2,
        text: "1. Instalación y Preparación de Archivos CEL y CDR",
      },
      {
        type: "paragraph",
        text: "Actualizamos repositorios e instalamos Asterisk junto con los paquetes de sonido en español:",
      },
      {
        type: "code",
        language: "bash",
        text: "sudo apt-get update\nsudo apt-get install asterisk\nsudo apt-get install asterisk-core-sounds-es-wav asterisk-prompt-es\nservice asterisk status",
      },
      {
        type: "paragraph",
        text: "Respaldamos y ajustamos la configuración de radiusclient en 'cel.conf':",
      },
      {
        type: "code",
        language: "bash",
        text: "cp /etc/asterisk/cel.conf /etc/asterisk/cel.conf.copia\ngedit /etc/asterisk/cel.conf",
      },
      {
        type: "image",
        src: "/images/blog/aso/image66.png",
        alt: "Ajuste en cel.conf",
      },
      {
        type: "paragraph",
        text: "Repetimos en 'cdr.conf' descomentando la línea requerida y reiniciamos el servicio:",
      },
      {
        type: "code",
        language: "bash",
        text: "cp /etc/asterisk/cdr.conf /etc/asterisk/cdr.conf.copia\ngedit /etc/asterisk/cdr.conf\nservice asterisk restart",
      },
      {
        type: "image",
        src: "/images/blog/aso/image67.png",
        alt: "Ajuste en cdr.conf",
      },
      {
        type: "heading",
        level: 2,
        text: "2. Configuración de Extensiones en sip.conf",
      },
      {
        type: "paragraph",
        text: "Respaldamos 'sip.conf', limpiamos comentarios y creamos la plantilla de usuario y las extensiones 2001 y 2002:",
      },
      {
        type: "code",
        language: "ini",
        text: "[usuario](!)\ntype=friend\nhost=dynamic\ncontext=alksoft\n\n[ext2001](usuario)\nusername=juan\nsecret=ClaveExt2001!\n\n[ext2002](usuario)\nusername=jesus\nsecret=ClaveExt2002!\nport=5061",
      },
      {
        type: "heading",
        level: 2,
        text: "3. Plan de Marcado en extensions.conf",
      },
      {
        type: "paragraph",
        text: "Definimos el contexto de llamada en '/etc/asterisk/extensions.conf':",
      },
      {
        type: "code",
        language: "ini",
        text: "[alksoft]\nexten => 2001,1,Dial(SIP/ext2001,20)\nsame => n,Hangup()\n\nexten => 2002,1,Dial(SIP/ext2002,20)\nsame => n,Hangup()",
      },
      {
        type: "image",
        src: "/images/blog/aso/image68.png",
        alt: "Configuración de extensions.conf",
      },
      {
        type: "paragraph",
        text: "Recargamos el servicio:",
      },
      { type: "code", language: "bash", text: "service asterisk reload" },
      {
        type: "heading",
        level: 2,
        text: "4. Comprobación y Llamadas de Voz con Zoiper",
      },
      {
        type: "paragraph",
        text: "Descargamos e instalamos Zoiper en el equipo cliente y configuramos la cuenta con usuario, IP y clave:",
      },
      {
        type: "image",
        src: "/images/blog/aso/image69.png",
        alt: "Zoiper - Ingreso de credenciales SIP",
      },
      {
        type: "image",
        src: "/images/blog/aso/image70.png",
        alt: "Zoiper - Validación de host y nombre de usuario",
      },
      {
        type: "image",
        src: "/images/blog/aso/image71.png",
        alt: "Zoiper - Protocolo SIP UDP detectado",
      },
      {
        type: "paragraph",
        text: "Marcamos la extensión remota desde el softphone y verificamos el enlace de voz activo:",
      },
      {
        type: "image",
        src: "/images/blog/aso/image72.png",
        alt: "Marcado de extensión en dialpad",
      },
      {
        type: "image",
        src: "/images/blog/aso/image73.png",
        alt: "Recepción de llamada entrante",
      },
      {
        type: "image",
        src: "/images/blog/aso/image74.png",
        alt: "Comunicación de voz establecida",
      },
    ],
  },
  {
    slug: "aso-06-acceso-remoto-ssh-hardening",
    seriesOrder: 6,
    title: "Acceso Remoto Seguro y Hardening con OpenSSH Server",
    excerpt:
      "Instalación de openssh-server, securización de sshd_config para mitigar ataques de fuerza bruta, restricción de acceso a root y comprobación remota con clientes SSH.",
    tags: ["linux", "ssh", "seguridad", "sysadmin", "redes", "archivo-2020"],
    coverImage: "/images/blog/aso/image79.png",
    blocks: [
      { type: "blockquote", text: CLARIFICATION_NOTE },
      {
        type: "heading",
        level: 2,
        text: "1. Instalación y Apertura de Configuración de OpenSSH",
      },
      {
        type: "paragraph",
        text: "Actualizamos los repositorios e instalamos el paquete openssh-server:",
      },
      {
        type: "code",
        language: "bash",
        text: "sudo apt-get update\nsudo apt-get install openssh-server\nsudo gedit /etc/ssh/sshd_config",
      },
      {
        type: "image",
        src: "/images/blog/aso/image75.png",
        alt: "Apertura de sshd_config",
      },
      {
        type: "heading",
        level: 2,
        text: "2. Hardening y Parámetros Defensivos",
      },
      {
        type: "paragraph",
        text: "Aplicamos los ajustes de endurecimiento en 'sshd_config':",
      },
      {
        type: "bulletList",
        items: [
          "Descomentar Port 22.",
          "Ajustar LoginGraceTime a un tiempo prudencial.",
          "Descomentar PermitRootLogin y establecerlo en 'no'.",
          "Descomentar StrictModes y fijarlo en 'yes'.",
          "Añadir directiva AllowUsers con el nombre del usuario autorizado.",
          "Descomentar MaxAuthTries fijándolo en 5 intentos.",
          "Descomentar MaxStartups fijándolo en 5.",
        ],
      },
      {
        type: "image",
        src: "/images/blog/aso/image76.png",
        alt: "Parámetros defensivos configurados en sshd_config",
      },
      {
        type: "paragraph",
        text: "Guardamos los cambios, reiniciamos el servicio y verificamos que esté activo:",
      },
      {
        type: "code",
        language: "bash",
        text: "sudo service ssh restart\nsudo service ssh status",
      },
      {
        type: "image",
        src: "/images/blog/aso/image77.png",
        alt: "Estado activo de OpenSSH",
      },
      {
        type: "heading",
        level: 2,
        text: "3. Comprobación desde Clientes Remotos (PuTTY)",
      },
      {
        type: "paragraph",
        text: "Descargamos e iniciamos PuTTY en el cliente, introduciendo la dirección IP del servidor y el puerto configurado:",
      },
      {
        type: "image",
        src: "/images/blog/aso/image78.png",
        alt: "Configuración de sesión en PuTTY",
      },
      {
        type: "paragraph",
        text: "Iniciamos la sesión e ingresamos las credenciales autorizadas en la consola remota:",
      },
      {
        type: "image",
        src: "/images/blog/aso/image79.png",
        alt: "Sesión remota SSH establecida con éxito",
      },
      {
        type: "paragraph",
        text: "Con esto se verifica el canal cifrado remoto, completando la suite de servicios de infraestructura del laboratorio.",
      },
    ],
  },
];

console.log(
  `Escribiendo ${posts.length} entradas con todas las imágenes en ${draftsDir}...`,
);

for (const p of posts) {
  const filePath = path.join(draftsDir, `${p.slug}.es.json`);
  const draftData = {
    slug: p.slug,
    locale: "es",
    status: "DRAFT",
    publishedAt: ARCHIVE_DATE,
    createdAt: ARCHIVE_DATE,
    seriesName: SERIES_NAME,
    seriesOrder: p.seriesOrder,
    title: p.title,
    excerpt: p.excerpt,
    tags: p.tags,
    coverImage: p.coverImage || null,
    content: buildDoc(p.blocks),
  };

  fs.writeFileSync(filePath, JSON.stringify(draftData, null, 2), "utf8");
  console.log(
    `✔ Creado con imágenes: ${p.slug}.es.json (Parte ${p.seriesOrder})`,
  );
}

console.log("¡Todas las entradas con imágenes generadas exitosamente!");
