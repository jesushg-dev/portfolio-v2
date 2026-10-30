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
      default:
        return paragraph("");
    }
  });
  return { type: "doc", content };
}

const SERIES_NAME = "Arquitectura de Sistemas Operativos: Kernel, Personalización y Servicios";
const ARCHIVE_DATE = "2020-11-23T00:00:00.000Z";
const CLARIFICATION_NOTE = 
  "Nota histórica y de archivo: Este artículo forma parte de una serie de laboratorio desarrollada originalmente el 23 de noviembre de 2020 para la asignatura de Arquitectura de Sistemas Operativos en la Universidad Nacional de Ingeniería (UNI), Managua. Se preserva con fines didácticos e históricos, integrando notas técnicas actualizadas sobre estándares modernos de Linux y redes.";

const posts = [
  {
    slug: "aso-01-ubuntu-mate-entorno",
    seriesOrder: 1,
    title: "Ubuntu MATE como Entorno de Ingeniería de Sistemas Operativos",
    excerpt: "Reseña histórica de Ubuntu MATE, entorno de escritorio MATE vs GNOME 3, eficiencia de recursos y configuración inicial para desarrollo y administración de sistemas.",
    tags: ["linux", "ubuntu-mate", "sistemas-operativos", "universidad", "archivo-2020"],
    blocks: [
      { type: "blockquote", text: CLARIFICATION_NOTE },
      { type: "heading", level: 2, text: "Introducción y Reseña de Ubuntu MATE" },
      {
        type: "paragraph",
        text: "Ubuntu MATE es una distribución de software libre y código abierto, estable y accesible, diseñada con un entorno de escritorio configurable. Es ideal para estaciones de trabajo de desarrollo que buscan maximizar el rendimiento del hardware conservando una metáfora de escritorio tradicional y predecible.",
      },
      {
        type: "paragraph",
        text: "La distribución nació de la mano de Martin Wimpress y Alan Pope a partir de Ubuntu 14.10, convirtiéndose formalmente en sabor oficial de Canonical en febrero de 2015. Esto le permitió integrarse plenamente en la infraestructura de compilación, empaquetado y control de calidad de Canonical Ltd.",
      },
      { type: "heading", level: 2, text: "Arquitectura de Escritorio: MATE vs. GNOME 3" },
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
      { type: "heading", level: 2, text: "Personalización de Entorno con MATE Tweak" },
      {
        type: "paragraph",
        text: "A través de la utilidad MATE Tweak, el usuario puede alternar entre distintas metáforas de interfaz gráfica con un solo clic: 'Traditional' (dos paneles clásicos al estilo GNOME 2), 'Redmond' (panel inferior con menú de inicio tipo Windows), 'Cupertino' (barra superior y dock al estilo macOS) o 'Mutiny' (panel lateral al estilo Unity).",
      },
      { type: "heading", level: 2, text: "Preparación del Sistema para Laboratorios de Bajo Nivel" },
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
    excerpt: "Guía paso a paso para descargar el árbol del kernel Linux, configurar .config, modificar init/main.c con printk a nivel de alerta y compilar paquetes Debian con make deb-pkg.",
    tags: ["linux", "kernel", "lenguaje-c", "compilacion", "sistemas-operativos", "archivo-2020"],
    blocks: [
      { type: "blockquote", text: CLARIFICATION_NOTE },
      { type: "heading", level: 2, text: "¿Por qué modificar y compilar el Kernel?" },
      {
        type: "paragraph",
        text: "El núcleo (kernel) de Linux gestiona el acceso al hardware, la asignación de memoria, la planificación de procesos y las llamadas al sistema. Aunque las distribuciones proveen núcleos precompilados, compilar desde las fuentes permite habilitar características experimentales, depurar subsistemas, optimizar para arquitecturas específicas y comprender el flujo de arranque en el anillo de ejecución más privilegiado (Ring 0).",
      },
      { type: "heading", level: 2, text: "1. Instalación de Herramientas de Compilación" },
      {
        type: "paragraph",
        text: "Para procesar el código en C, ensamblador y las tablas de configuración del árbol del kernel, se requieren las siguientes bibliotecas y utilidades:",
      },
      {
        type: "code",
        language: "bash",
        text: "sudo apt update\nsudo apt install -y gcc make bc bison flex libssl-dev libelf-dev libncurses-dev rsync build-essential",
      },
      {
        type: "bulletList",
        items: [
          "gcc y make: compilador C y motor de construcción del proyecto.",
          "bison y flex: generadores de analizadores sintácticos y léxicos requeridos durante el parseo de configuraciones.",
          "libncurses-dev: biblioteca para interfaces en terminal requerida por make menuconfig.",
          "libssl-dev y libelf-dev: soporte para firmado criptográfico y análisis de binarios ELF.",
        ],
      },
      { type: "heading", level: 2, text: "2. Descarga y Descompresión del Kernel" },
      {
        type: "paragraph",
        text: "Se descarga el tarball oficial desde el repositorio de kernel.org. En el laboratorio original se empleó la versión 5.9.8; el procedimiento se mantiene idéntico en versiones modernas 6.x:",
      },
      {
        type: "code",
        language: "bash",
        text: "cd ~/Descargas\nwget https://cdn.kernel.org/pub/linux/kernel/v5.x/linux-5.9.8.tar.xz\ntar -xvf linux-5.9.8.tar.xz\ncd linux-5.9.8",
      },
      { type: "heading", level: 2, text: "3. Configuración del Núcleo (.config)" },
      {
        type: "paragraph",
        text: "Para asegurar compatibilidad con el hardware en uso, clonamos la configuración del kernel que se encuentra actualmente en ejecución:",
      },
      {
        type: "code",
        language: "bash",
        text: "cp -v /boot/config-$(uname -r) ./.config\n# Aclaración técnica moderna para distribuciones Ubuntu/Debian:\n# Desactivar certificados de confianza locales para evitar fallos de firma:\nscripts/config --set-str SYSTEM_TRUSTED_KEYS \"\"\nscripts/config --set-str SYSTEM_REVOCATION_KEYS \"\"",
      },
      { type: "heading", level: 2, text: "4. Modificación de Código en init/main.c" },
      {
        type: "paragraph",
        text: "Accedemos al subsistema de inicialización en 'init/main.c', el cual contiene la función start_kernel() y la cadena de montaje de los primeros procesos. Localizamos la función numa_default_policy() e insertamos una llamada con printk:",
      },
      {
        type: "code",
        language: "c",
        text: "/* Modificación en init/main.c tras numa_default_policy() */\nprintk(KERN_ALERT \"===========================================\\n\");\nprintk(KERN_ALERT \"[UNI-ASO] Kernel personalizado iniciado!\\n\");\nprintk(KERN_ALERT \"Integrantes: Jesus Hernandez & Juan Lopez\\n\");\nprintk(KERN_ALERT \"===========================================\\n\");\nmdelay(10000); /* Retardo de 10 segundos para visualización */",
      },
      {
        type: "paragraph",
        text: "Nota técnica: 'KERN_ALERT' garantiza que el mensaje se emita a la consola independientemente del nivel de log. La función 'mdelay(10000)' implementa un bucle de espera activa (busy-wait); en entornos de producción debe evitarse ya que retiene el hilo de arranque del CPU.",
      },
      { type: "heading", level: 2, text: "5. Compilación e Instalación de Paquetes Debian" },
      {
        type: "paragraph",
        text: "Compilamos usando 'deb-pkg'. Se recomienda enfáticamente usar '-j$(nproc)' para habilitar paralelismo multihilo y recortar el tiempo de compilación:",
      },
      {
        type: "code",
        language: "bash",
        text: "make -j$(nproc) bindeb-pkg\ncd ..\nsudo dpkg -i linux-image-*.deb linux-headers-*.deb\nsudo update-grub\nsudo reboot",
      },
      {
        type: "paragraph",
        text: "Tras el reinicio, ejecutamos 'uname -r' para verificar la carga del nuevo kernel modificado y comprobar la emisión del mensaje en dmesg.",
      },
    ],
  },
  {
    slug: "aso-03-personalizar-grub-plymouth",
    seriesOrder: 3,
    title: "Personalización del Gestor de Arranque: GRUB 2 y Splash Screen Plymouth",
    excerpt: "Ajuste de resolución y fondo de pantalla en /etc/default/grub, regeneración del archivo de configuración con update-grub y sustitución de logotipos de inicio en initramfs.",
    tags: ["linux", "grub", "plymouth", "bootloader", "personalizacion", "archivo-2020"],
    blocks: [
      { type: "blockquote", text: CLARIFICATION_NOTE },
      { type: "heading", level: 2, text: "Etapas de Arranque Gráfico en Linux" },
      {
        type: "paragraph",
        text: "Cuando el firmware UEFI/BIOS cede el control a GRUB 2 (Grand Unified Bootloader), este presenta el menú de selección de núcleos y sistemas operativos. Posteriormente, el kernel inicializa el hardware y delega la experiencia visual de carga a Plymouth, ocultando los mensajes de inicialización detrás de un splash screen.",
      },
      { type: "heading", level: 2, text: "1. Personalización de GRUB (/etc/default/grub)" },
      {
        type: "paragraph",
        text: "Para personalizar el menú de GRUB, abrimos su archivo de configuración principal con permisos de superusuario:",
      },
      {
        type: "code",
        language: "bash",
        text: "sudo nano /etc/default/grub",
      },
      {
        type: "paragraph",
        text: "Realizamos los siguientes ajustes en las directivas:",
      },
      {
        type: "bulletList",
        items: [
          "Comentar '#GRUB_TIMEOUT_STYLE=hidden' para asegurar que el menú sea visible.",
          "Establecer 'GRUB_TIMEOUT=10' para dar 10 segundos de margen de selección.",
          "Verificar la resolución soportada con el comando 'xrandr' y asignarla en 'GRUB_GFXMODE=\"1920x1080\"' (o la nativa del monitor).",
          "Agregar la ruta absoluta a la imagen de fondo con 'GRUB_BACKGROUND=\"/home/usuario/Imágenes/fondo-grub.png\"'.",
        ],
      },
      {
        type: "code",
        language: "bash",
        text: "# Regenerar la configuración /boot/grub/grub.cfg\nsudo update-grub",
      },
      { type: "heading", level: 2, text: "2. Personalización del Splash Screen con Plymouth" },
      {
        type: "paragraph",
        text: "Plymouth se ejecuta desde el initramfs antes de que los sistemas de archivos raíz se monten en modo lectura/escritura. Para sustituir el logotipo de arranque:",
      },
      {
        type: "code",
        language: "bash",
        text: "# Reemplazar las imágenes por el logotipo deseado en formato PNG\nsudo cp mi-logo.png /usr/share/plymouth/ubuntu-logo.png\nsudo cp mi-logo.png /usr/share/plymouth/themes/ubuntu-mate-logo/ubuntu-mate-logo.png\nsudo cp mi-logo.png /usr/share/plymouth/themes/ubuntu-mate-logo/ubuntu-mate-logo16.png\n\n# Reconstruir la imagen del sistema de archivos en memoria (initramfs)\nsudo update-initramfs -u",
      },
      {
        type: "paragraph",
        text: "Reiniciamos el sistema con 'sudo reboot' para constatar que tanto la pantalla de selección de GRUB como la animación de carga de Plymouth reflejan la identidad visual personalizada.",
      },
    ],
  },
  {
    slug: "aso-04-servidor-archivos-vsftpd",
    seriesOrder: 4,
    title: "Despliegue y Seguridad de un Servidor de Archivos FTP con vsftpd",
    excerpt: "Instalación de vsftpd en Ubuntu, enjaulado chroot de usuarios, cortafuegos UFW, políticas de permisos seguras y comprobación desde clientes Windows y Android.",
    tags: ["linux", "ftp", "vsftpd", "redes", "seguridad", "archivo-2020"],
    blocks: [
      { type: "blockquote", text: CLARIFICATION_NOTE },
      { type: "heading", level: 2, text: "Fundamentos del Protocolo FTP y Seguridad" },
      {
        type: "paragraph",
        text: "El protocolo FTP (File Transfer Protocol) opera sobre una arquitectura cliente-servidor desacoplando el canal de control (puerto 21 TCP) del canal de transferencia de datos (puerto 20 en modo activo o puertos dinámicos en modo pasivo).",
      },
      { type: "heading", level: 2, text: "1. Instalación de vsftpd y Configuración de Firewall" },
      {
        type: "code",
        language: "bash",
        text: "sudo apt update\nsudo apt install -y vsftpd\nsudo systemctl status vsftpd\n\n# Configurar puertos en el cortafuegos UFW\nsudo ufw allow 20/tcp\nsudo ufw allow 21/tcp\nsudo ufw allow 40000:40100/tcp # Rango para modo pasivo",
      },
      { type: "heading", level: 2, text: "2. Creación de Usuario Dedicado y Enjaulado (Chroot)" },
      {
        type: "paragraph",
        text: "Por seguridad, aislamos al usuario FTP sin acceso a la consola interactiva SSH y configuramos una jaula de directorio estricta:",
      },
      {
        type: "code",
        language: "bash",
        text: "# Crear usuario con shell restringido\nsudo adduser usuario_ftp\n\n# Denegar acceso interactivo por SSH en /etc/ssh/sshd_config agregando:\n# DenyUsers usuario_ftp\nsudo systemctl restart ssh\n\n# Estructura de directorio segura para chroot en vsftpd\nsudo mkdir -p /home/usuario_ftp/ftp/archivos\nsudo chown nobody:nogroup /home/usuario_ftp/ftp\nsudo chmod a-w /home/usuario_ftp/ftp\nsudo chown usuario_ftp:usuario_ftp /home/usuario_ftp/ftp/archivos\nsudo chmod 755 /home/usuario_ftp/ftp/archivos",
      },
      {
        type: "paragraph",
        text: "Aclaración técnica sobre permisos: En administraciones de sistemas profesionales nunca se debe otorgar 'chmod 777' en directorios compartidos. La raíz enjaulada debe ser propiedad de nobody sin permisos de escritura global, mientras que el subdirectorio de subida debe tener permisos '755' (rwxr-xr-x) o '775' controlados.",
      },
      { type: "heading", level: 2, text: "3. Ajustes en /etc/vsftpd.conf" },
      {
        type: "paragraph",
        text: "Editamos '/etc/vsftpd.conf' para activar escritura, habilitar la jaula chroot y delimitar el modo pasivo:",
      },
      {
        type: "code",
        language: "ini",
        text: "write_enable=YES\nchroot_local_user=YES\nuser_sub_token=$USER\nlocal_root=/home/$USER/ftp\npasv_min_port=40000\npasv_max_port=40100",
      },
      {
        type: "code",
        language: "bash",
        text: "sudo systemctl restart vsftpd",
      },
      { type: "heading", level: 2, text: "4. Comprobación Multiplataforma" },
      {
        type: "paragraph",
        text: "Obtenemos la dirección IP del servidor ('ip addr show' o 'ifconfig') y realizamos pruebas de transferencia:",
      },
      {
        type: "bulletList",
        items: [
          "Desde Windows: Utilizando FileZilla Client ingresando IP, usuario, contraseña y puerto 21.",
          "Desde Android: Utilizando Cx File Explorer, seleccionando pestaña Red > Añadir > FTP e ingresando las credenciales.",
        ],
      },
    ],
  },
  {
    slug: "aso-05-servidor-voip-asterisk-pbx",
    seriesOrder: 5,
    title: "Telefonía IP y Servidor VoIP con Asterisk PBX en Linux",
    excerpt: "Configuración de una centralita telefónica con Asterisk, creación de usuarios y extensiones SIP, definición del dialplan en extensions.conf y llamadas de prueba con softphones.",
    tags: ["linux", "voip", "asterisk", "sip", "telefonia-ip", "archivo-2020"],
    blocks: [
      { type: "blockquote", text: CLARIFICATION_NOTE },
      { type: "heading", level: 2, text: "Introducción a la Telefonía IP y Asterisk" },
      {
        type: "paragraph",
        text: "Asterisk es un framework de telecomunicaciones de código abierto que convierte una máquina Linux en una central telefónica IP (PBX). Emplea el protocolo SIP (Session Initiation Protocol, puerto 5060 UDP) para la señalización y establecimiento de sesiones, y RTP (Real-time Transport Protocol) para el transporte de audio bidireccional.",
      },
      {
        type: "paragraph",
        text: "Nota técnica sobre canales SIP: En el momento de este laboratorio (2020) el canal tradicional 'chan_sip' ('sip.conf') era estándar. A partir de Asterisk 21, 'chan_sip' fue definitivamente retirado en favor de 'chan_pjsip' ('pjsip.conf'). Se preserva aquí la configuración didáctica clásica.",
      },
      { type: "heading", level: 2, text: "1. Instalación de Asterisk y Paquetes de Sonido" },
      {
        type: "code",
        language: "bash",
        text: "sudo apt update\nsudo apt install -y asterisk asterisk-core-sounds-es-wav asterisk-prompt-es\nsudo systemctl enable asterisk\nsudo systemctl start asterisk",
      },
      { type: "heading", level: 2, text: "2. Creación de Extensiones en sip.conf" },
      {
        type: "paragraph",
        text: "Creamos un respaldo de '/etc/asterisk/sip.conf' y definimos una plantilla reutilizable y las extensiones 2001 y 2002:",
      },
      {
        type: "code",
        language: "ini",
        text: "[usuario](!)\ntype=friend\nhost=dynamic\ncontext=alksoft\ndisallow=all\nallow=ulaw\nallow=alaw\n\n[ext2001](usuario)\nusername=juan\nsecret=ClaveSegura2001!\n\n[ext2002](usuario)\nusername=jesus\nsecret=ClaveSegura2002!",
      },
      { type: "heading", level: 2, text: "3. Definición del Plan de Marcado en extensions.conf" },
      {
        type: "paragraph",
        text: "El archivo '/etc/asterisk/extensions.conf' controla la lógica de enrutamiento telefónico mediante la directiva: exten => <número>,<prioridad>,<aplicación>(<parámetros>):",
      },
      {
        type: "code",
        language: "ini",
        text: "[alksoft]\nexten => 2001,1,Dial(SIP/ext2001,20)\nsame => n,Hangup()\n\nexten => 2002,1,Dial(SIP/ext2002,20)\nsame => n,Hangup()",
      },
      {
        type: "code",
        language: "bash",
        text: "# Recargar configuración sin detener llamadas activas\nsudo asterisk -rx \"sip reload\"\nsudo asterisk -rx \"dialplan reload\"\n# Verificar clientes registrados\nsudo asterisk -rx \"sip show peers\"",
      },
      { type: "heading", level: 2, text: "4. Comprobación con Softphones (Zoiper)" },
      {
        type: "paragraph",
        text: "Se instala el cliente Zoiper en dos dispositivos independientes (Windows/Linux y Android):",
      },
      {
        type: "orderedList",
        items: [
          "Configurar cuenta con formato: 'ext2001@IP_DEL_SERVIDOR' y su respectivo secreto.",
          "Seleccionar protocolo SIP UDP y validar el registro con estado 'Account is ready'.",
          "Marcar la extensión 2002 desde el softphone 2001 y verificar la transmisión de voz en tiempo real.",
        ],
      },
    ],
  },
  {
    slug: "aso-06-acceso-remoto-ssh-hardening",
    seriesOrder: 6,
    title: "Acceso Remoto Seguro y Hardening con OpenSSH Server",
    excerpt: "Instalación de openssh-server, securización de sshd_config para mitigar ataques de fuerza bruta, restricción de acceso a root y comprobación remota con clientes SSH.",
    tags: ["linux", "ssh", "seguridad", "sysadmin", "redes", "archivo-2020"],
    blocks: [
      { type: "blockquote", text: CLARIFICATION_NOTE },
      { type: "heading", level: 2, text: "Arquitectura y Criptografía de OpenSSH" },
      {
        type: "paragraph",
        text: "OpenSSH provee un canal seguro de administración remota sobre redes inseguras utilizando criptografía de clave pública para la autenticación de servidores/clientes y cifrado simétrico para el tráfico de la sesión. Es el estándar de facto para la administración de servidores UNIX.",
      },
      { type: "heading", level: 2, text: "1. Instalación y Verificación del Servicio" },
      {
        type: "code",
        language: "bash",
        text: "sudo apt update\nsudo apt install -y openssh-server\nsudo systemctl enable ssh\nsudo systemctl status ssh",
      },
      { type: "heading", level: 2, text: "2. Hardening y Parámetros Defensivos en sshd_config" },
      {
        type: "paragraph",
        text: "Para endurecer la seguridad del demonio '/etc/ssh/sshd_config', se aplican las siguientes directivas recomendadas:",
      },
      {
        type: "code",
        language: "ini",
        text: "Port 22\nLoginGraceTime 60\nPermitRootLogin no\nStrictModes yes\nMaxAuthTries 5\nMaxStartups 5:30:100\nAllowUsers usuario_autorizado",
      },
      {
        type: "bulletList",
        items: [
          "PermitRootLogin no: previene ataques de diccionario directos contra el superusuario.",
          "MaxAuthTries 5: corta la conexión tras 5 intentos fallidos, mitigando fuerza bruta automatizada.",
          "MaxStartups: limita las conexiones concurrentes no autenticadas para resistir inundaciones DoS.",
          "AllowUsers: establece una lista blanca explícita de cuentas autorizadas a ingresar por SSH.",
        ],
      },
      {
        type: "code",
        language: "bash",
        text: "sudo sshd -t # Comprobar sintaxis antes de reiniciar\nsudo systemctl restart ssh",
      },
      { type: "heading", level: 2, text: "3. Buenas Prácticas Modernas: Autenticación por Llaves Ed25519" },
      {
        type: "paragraph",
        text: "En administraciones actuales se recomienda prescindir completamente de contraseñas mediante criptografía de curva elíptica Ed25519:",
      },
      {
        type: "code",
        language: "bash",
        text: "# En la máquina cliente:\nssh-keygen -t ed25519 -C \"admin@uni-aso\"\nssh-copy-id -i ~/.ssh/id_ed25519.pub usuario_autorizado@IP_SERVIDOR\n\n# Luego en /etc/ssh/sshd_config deshabilitar contraseñas:\n# PasswordAuthentication no",
      },
      { type: "heading", level: 2, text: "4. Comprobación y Acceso desde Clientes" },
      {
        type: "paragraph",
        text: "Desde clientes Windows se valida la conexión empleando PuTTY o la terminal nativa de PowerShell con: 'ssh usuario_autorizado@IP_SERVIDOR', confirmando la correcta autenticación y el bloqueo a usuarios no autorizados o peticiones directas de root.",
      },
      { type: "heading", level: 2, text: "Conclusiones del Laboratorio Integrado" },
      {
        type: "paragraph",
        text: "Este proyecto integral consolida los pilares formativos de la arquitectura de sistemas operativos: el control y extensión del kernel en Ring 0, la orquestación del proceso de arranque (GRUB/Plymouth) y la administración de subsistemas de red esenciales (almacenamiento, voz y acceso remoto seguro).",
      },
    ],
  },
];

console.log(`Escribiendo ${posts.length} entradas en ${draftsDir}...`);

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
    coverImage: null,
    content: buildDoc(p.blocks),
  };

  fs.writeFileSync(filePath, JSON.stringify(draftData, null, 2), "utf8");
  console.log(`✔ Creado: ${p.slug}.es.json (Parte ${p.seriesOrder})`);
}

console.log("¡Todas las entradas generadas exitosamente!");
