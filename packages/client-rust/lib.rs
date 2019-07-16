#[no_mangle]
pub fn add(a: i32, b: i32) -> i32 {
  return a + b;
}

#[no_mangle]
pub fn getFrequencyUsingHalfStepsFromA4(halfSteps: f64) -> f64 {
	let fixedNoteFrequency = 440.0;
  
	let twelfthRootOf2 = f64::powf(2.0, 1.0 / 12.0); // 1.059463094359...

	return fixedNoteFrequency * twelfthRootOf2.powf(halfSteps);
}
