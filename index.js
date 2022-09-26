const {
  option,
  a,
  h5,
  span,
  text_attr,
  script,
  input,
  style,
  domReady,
} = require("@saltcorn/markup/tags");
const tags = require("@saltcorn/markup/tags");
const { select_options } = require("@saltcorn/markup/helpers");
const { features } = require("@saltcorn/data/db/state");
const Workflow = require("@saltcorn/data/models/workflow");
const Form = require("@saltcorn/data/models/form");

const selectize = {
  /** @type {string} */
  type: "Key",
  /** @type {boolean} */
  isEdit: true,
  blockDisplay: true,

  /**
   * @type {object[]}
   */

  configFields: () => [
    {
      name: "neutral_label",
      label: "Neutral label",
      type: "String",
    },
    {
      name: "where",
      label: "Where",
      type: "String",
    },
    {
      name: "maxHeight",
      label: "max-height px",
      type: "Integer",
    },
    {
      name: "force_required",
      label: "Force required",
      sublabel:
        "User must select a value, even if the table field is not required",
      type: "Bool",
    },
    {
      name: "label_formula",
      label: "Label formula",
      type: "String",
      class: "validate-expression",
      sublabel: "Uses summary field if blank",
    },
  ],

  /**
   * @param {*} nm
   * @param {*} v
   * @param {*} attrs
   * @param {*} cls
   * @param {*} reqd
   * @param {*} field
   * @returns {object}
   */
  run: (nm, v, attrs, cls, reqd, field) => {
    if (attrs.disabled)
      return (
        input({
          class: `${cls} ${field.class || ""}`,
          "data-fieldname": field.form_name,
          name: text_attr(nm),
          id: `input${text_attr(nm)}`,
          readonly: true,
          placeholder: v || field.label,
        }) + span({ class: "ml-m1" }, "v")
      );
    //console.log("select2 attrs", attrs);
    return (
      tags.select(
        {
          class: `form-control ${cls} ${field.class || ""} selectize-nm-${text_attr(nm)}`,
          "data-fieldname": field.form_name,
          name: text_attr(nm),
          onChange: attrs.onChange,
          id: `input${text_attr(nm)}`,
          ...(attrs?.dynamic_where
            ? {
              "data-selected": v,
              "data-fetch-options": encodeURIComponent(
                JSON.stringify(attrs?.dynamic_where)
              ),
            }
            : {}),
        },
        select_options(
          v,
          field,
          (attrs || {}).force_required,
          (attrs || {}).neutral_label
        )
      ) +
      script(
        domReady(
          `$('#input${text_attr(
            nm
          )}').selectize();         
          document.getElementById('input${text_attr(
            nm
          )}').addEventListener('RefreshSelectOptions', (e) => { }, false);
        `
        )
      ) +
      (attrs?.maxHeight
        ? style(
          `.selectize-dropdown.selectize-nm-${text_attr(
            nm
          )} .selectize-dropdown-content {
            max-height: ${attrs?.maxHeight
          }px;            
          } `
        )
        : "")
    );
  },
};
const configuration_workflow = () =>
  new Workflow({
    steps: [
      {
        name: "everything",
        form: async (context) => {
          return new Form({
            fields: [
              {
                name: "everything",
                label: "Selectize everything",
                sublabel: "Apply selectize everywhere possible",
                type: "Bool",
              },
            ],
          });
        },
      },
    ],
  });
const fieldviews = () => ({ selectize });

module.exports = {
  sc_plugin_api_version: 1,
  fieldviews,
  configuration_workflow,
  plugin_name: "selectize",
  //viewtemplates: [require("./edit-nton")],
  headers: ({ everything }) => [
    {
      script: "/plugins/public/selectize/selectize.min.js",
    },
    {
      css: "/plugins/public/selectize/selectize.bootstrap5.css",
    },
    ...everything ? [{
      script: `/plugins/public/selectize${features?.version_plugin_serve_path
        ? "@" + require("./package.json").version
        : ""
        }/selectize_everything.js`,
    }] : []

  ],
};
