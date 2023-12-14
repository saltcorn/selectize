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
const Table = require("@saltcorn/data/models/table");
const View = require("@saltcorn/data/models/view");
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

    let opts = select_options(
      v,
      field,
      (attrs || {}).force_required,
      (attrs || {}).neutral_label
    );
    if (attrs.isFilter && field.required)
      opts = `<option value="">${attrs?.neutral_label || ""}</option>` + opts;
    const noChange = attrs.isFilter && attrs.dynamic_where;
    return (
      tags.select(
        {
          class: `form-control scfilter ${cls} ${
            field.class || ""
          } selectize-nm-${text_attr(nm)}`,
          "data-fieldname": field.form_name,
          name: text_attr(nm),
          onChange: !noChange && attrs.onChange,
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
        opts
      ) +
      script(
        domReady(
          `$('#input${text_attr(nm)}').selectize(${
            attrs?.isFilter || field.required
              ? `{plugins: ["remove_button"],}`
              : ""
          });         
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
            max-height: ${attrs?.maxHeight}px;            
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

const search_or_create_selectize = {
  /** @type {string} */
  type: "Key",
  /** @type {boolean} */
  isEdit: true,
  blockDisplay: true,
  description:
    "Select from dropdown, or give user the option of creating a new relation in a popup",

  /**
   * @param {object} field
   * @returns {Promise<object[]>}
   */
  configFields: async (field) => {
    const reftable = Table.findOne({ name: field.reftable_name });
    if (!reftable) return [];
    const views = await View.find({ table_id: reftable.id }, { cached: true });
    return [
      {
        name: "viewname",
        label: "View to create",
        input_type: "select",
        form_name: field.form_name,
        options: views.map((v) => v.name),
      },
      {
        name: "label",
        label: "Label on link to create",
        type: "String",
      },
      {
        name: "where",
        label: "Where",
        type: "String",
      },
      {
        name: "label_formula",
        label: "Option label formula",
        type: "String",
        class: "validate-expression",
        sublabel: "Uses summary field if blank",
      },
    ];
  },

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
    return (
      tags.select(
        {
          class: `form-control form-select ${cls} ${field.class || ""}`,
          "data-fieldname": field.form_name,

          name: text_attr(nm),
          id: `input${text_attr(nm)}`,
          disabled: attrs.disabled,
          readonly: attrs.readonly,
          onChange: attrs.onChange,
          autocomplete: "off",

          ...(attrs?.dynamic_where
            ? {
                "data-selected": v,
                "data-fetch-options": encodeURIComponent(
                  JSON.stringify(attrs?.dynamic_where)
                ),
              }
            : {}),
        },
        select_options(v, field)
      ) +
      a(
        {
          onclick: `ajax_modal('/view/${attrs.viewname}',{submitReload: false,onClose: soc_process_${nm}(this)})`,
          href: `javascript:void(0)`,
        },
        attrs.label || "Or create new"
      ) +
      script(
        domReady(
          `$('#input${text_attr(nm)}').selectize(${
            attrs?.isFilter || field.required
              ? `{plugins: ["remove_button"],}`
              : ""
          });         
        document.getElementById('input${text_attr(
          nm
        )}').addEventListener('RefreshSelectOptions', (e) => { }, false);

        window.soc_process_${nm} = (elem) => ()=> {
          $.ajax('/api/${field.reftable_name}', {
            success: function (res, textStatus, request) {
              const dataOptions=[]
              var opts = res.success.forEach(x=>{
                dataOptions.push({text: x.${attrs.summary_field}, value:x.id })
              })
              ${field.required ? "" : `dataOptions.push({text: "", value: ""})`}
              dataOptions.sort((a, b) =>
                (a.text?.toLowerCase?.() || a.text) >
                (b.text?.toLowerCase?.() || b.text)
                  ? 1
                  : -1
                );
              const e = $('#input${text_attr(nm)}')
              e.selectize()[0].selectize.clearOptions(true);
              e.selectize()[0].selectize.addOption(dataOptions);
              e.selectize()[0].selectize.setValue(res.success[res.success.length-1].id);
            }
          })
        }`
        )
      )
    );
  },
};

const fieldviews = () => ({ search_or_create_selectize, selectize });

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
      css: `/plugins/public/selectize@${
        require("./package.json").version
      }/selectize.bootstrap5.css`,
    },
    ...(everything
      ? [
          {
            script: `/plugins/public/selectize${
              features?.version_plugin_serve_path
                ? "@" + require("./package.json").version
                : ""
            }/selectize_everything.js`,
          },
        ]
      : []),
  ],
};
