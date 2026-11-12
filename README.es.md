# Melete para DSH

[English](README.md) | [简体中文](README.zh-CN.md) | Español

Revisa cómo trabajáis tú y la IA.

Melete es un complemento para DeepSeek Harness (DSH). Elige un periodo para crear tarjetas sobre tu colaboración con la IA y la conducta de la propia IA. Las observaciones incluyen fuentes y posibles interpretaciones; tú decides qué significan para ti.

## Uso

1. En DSH, abre Complementos, elige añadir uno, introduce la ruta absoluta de la carpeta del complemento y actívalo.
2. Abre la revisión en la barra lateral, elige el periodo y, si quieres, escribe tu intención.
3. Inicia la revisión. Puedes consultar o borrar los resultados en el historial.

Las revisiones abarcan sesiones de DSH e incluyen observaciones, fuentes, el comportamiento de la IA y una pregunta abierta. Si indicas una intención, pueden proponer un pequeño experimento. La interfaz admite chino simplificado, inglés, japonés, español, francés, alemán, ruso y portugués, con ocho estilos culturales antiguos. Puedes exportar una imagen o HTML; las revisiones se guardan en tu dispositivo. La carta privada aún no se puede generar.

## Privacidad y estado

El complemento lee las sesiones locales y elimina información sensible antes de enviar un resumen al modelo que hayas elegido en DSH; la transmisión y el tratamiento dependen de ese modelo. Melete no opera servidores ni recopila datos. Las revisiones y los ajustes se guardan en `~/.melete/` y pueden borrarse desde la configuración.

Es una versión de desarrollo que, por ahora, solo revisa sesiones de DSH. Se documentará la instalación mediante npm después de su publicación.

## Otras versiones de Melete

- [Melete Skill](https://github.com/yancanny/melete-skill): para herramientas de IA compatibles con habilidades.
- [Melete Magpie](https://github.com/yancanny/magpie-plugin-melete): revisa DSH o Codex en Magpie.

## Licencia

Código: Apache-2.0. El mapa de Melete: CC BY 4.0. Consulta [NOTICE](NOTICE) para la atribución y las licencias de imágenes y otros recursos.
