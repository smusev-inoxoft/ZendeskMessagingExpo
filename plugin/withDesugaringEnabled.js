const {
  withAppBuildGradle,
  WarningAggregator,
} = require("expo/config-plugins");

const addCompileOptions = (config) => {
  const appGradleContents = config.modResults.contents;
  const compileOptions = `
    compileOptions {
        coreLibraryDesugaringEnabled true
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }`;

  if (appGradleContents.includes("compileOptions")) {
    return;
  }

  const androidIndex = appGradleContents.indexOf("android {");
  if (androidIndex === -1) {
    WarningAggregator.addWarningAndroid(
      "withAppGradleDependencies",
      `Cannot find android section in app/build.gradle`,
    );
    return;
  }

  const insertIndex = appGradleContents.indexOf("{", androidIndex) + 1;
  config.modResults.contents =
    appGradleContents.slice(0, insertIndex) +
    compileOptions +
    appGradleContents.slice(insertIndex);
};

const addDesugaringDependencies = (config) => {
  const appGradleContents = config.modResults.contents;
  const dependencyName = "com.android.tools:desugar_jdk_libs";

  if (appGradleContents.includes(dependencyName)) {
    return;
  }

  const dependenciesIndex = appGradleContents.indexOf("dependencies {");
  if (dependenciesIndex === -1) {
    WarningAggregator.addWarningAndroid(
      "withAppGradleDependencies",
      `Cannot find dependencies section in app/build.gradle`,
    );
    return;
  }

  const insertIndex = appGradleContents.indexOf("{", dependenciesIndex) + 1;
  const dependency = `
    coreLibraryDesugaring '${dependencyName}:2.0.4'`;

  config.modResults.contents =
    appGradleContents.slice(0, insertIndex) +
    dependency +
    appGradleContents.slice(insertIndex);
};

module.exports = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      WarningAggregator.addWarningAndroid(
        "withAppGradleDependencies",
        `Cannot automatically configure app/build.gradle if it's not groovy`,
      );
      return config;
    }

    addCompileOptions(config);
    addDesugaringDependencies(config);
    return config;
  });
};
